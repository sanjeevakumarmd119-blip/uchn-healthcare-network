import prisma from '../db';
import { StockTransactionInput, CreateInventoryItemInput } from '../validators/inventory.validator';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';
import { emitInventoryUpdate } from '../socket';

export class InventoryService {
  static async recordStockTransaction(
    input: StockTransactionInput,
    performedById: string
  ) {
    const inventory = await prisma.medicineInventory.findUnique({
      where: { id: input.inventoryId },
      include: {
        medicine: true,
        clinic: {
          include: {
            clinicStaff: true,
          },
        },
      },
    });

    if (!inventory) {
      throw new Error('Inventory item not found.');
    }

    const previousQuantity = inventory.quantity;
    const newQuantity = previousQuantity + input.quantityChange;

    // Strict safety check: Never allow negative stock
    if (newQuantity < 0) {
      throw new Error(
        `Insufficient stock. Current available quantity is ${previousQuantity} units. Cannot dispense ${Math.abs(input.quantityChange)} units.`
      );
    }

    // Determine new status
    let newStatus = 'IN_STOCK';
    const isExpired = new Date(inventory.expiryDate) < new Date();

    if (isExpired) {
      newStatus = 'EXPIRED';
    } else if (newQuantity === 0) {
      newStatus = 'OUT_OF_STOCK';
    } else if (newQuantity <= inventory.minThreshold) {
      newStatus = 'LOW_STOCK';
    }

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedInventory = await tx.medicineInventory.update({
        where: { id: input.inventoryId },
        data: {
          quantity: newQuantity,
          status: newStatus,
        },
        include: {
          medicine: true,
          clinic: true,
        },
      });

      const transaction = await tx.medicineStockTransaction.create({
        data: {
          inventoryId: input.inventoryId,
          type: input.type,
          quantityChange: input.quantityChange,
          previousQuantity,
          newQuantity,
          reason: input.reason,
          performedById,
        },
      });

      return { updatedInventory, transaction };
    });

    // Check if low stock alert should be triggered
    if (newStatus === 'LOW_STOCK' || newStatus === 'OUT_OF_STOCK') {
      const alertTitle =
        newStatus === 'OUT_OF_STOCK'
          ? `⚠️ Out of Stock Alert: ${inventory.medicine.name}`
          : `⚠️ Low Stock Alert: ${inventory.medicine.name}`;

      const alertMsg =
        newStatus === 'OUT_OF_STOCK'
          ? `${inventory.medicine.name} (${inventory.sku}) at ${inventory.clinic.name} is completely out of stock.`
          : `Stock for ${inventory.medicine.name} (${inventory.sku}) has reached ${newQuantity} units (Threshold: ${inventory.minThreshold}).`;

      for (const staff of inventory.clinic.clinicStaff) {
        await NotificationService.create({
          userId: staff.userId,
          title: alertTitle,
          message: alertMsg,
          type: 'INVENTORY',
          link: '/doctor/inventory',
        });
      }
    }

    await AuditService.log({
      actorId: performedById,
      action: 'STOCK_UPDATED',
      entity: 'MedicineInventory',
      entityId: inventory.id,
      metadata: {
        medicine: inventory.medicine.name,
        type: input.type,
        change: input.quantityChange,
        newQuantity,
        reason: input.reason,
      },
    });

    emitInventoryUpdate(inventory.clinicId, {
      inventory: result.updatedInventory,
      transaction: result.transaction,
    });

    return result;
  }

  static async getClinicInventory(clinicId: string, status?: string, search?: string) {
    const where: any = { clinicId };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { sku: { contains: search } },
        { batchNumber: { contains: search } },
        { medicine: { name: { contains: search } } },
        { medicine: { genericName: { contains: search } } },
        { medicine: { category: { contains: search } } },
      ];
    }

    return prisma.medicineInventory.findMany({
      where,
      include: {
        medicine: true,
        transactions: {
          take: 5,
          orderBy: { timestamp: 'desc' },
          include: {
            performedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // EXPIRED and LOW_STOCK / OUT_OF_STOCK prominent
        { quantity: 'asc' },
      ],
    });
  }

  static async createInventoryItem(input: CreateInventoryItemInput, performedById: string) {
    const expiry = new Date(input.expiryDate);
    const isExpired = expiry < new Date();

    let status = 'IN_STOCK';
    if (isExpired) {
      status = 'EXPIRED';
    } else if (input.quantity === 0) {
      status = 'OUT_OF_STOCK';
    } else if (input.quantity <= input.minThreshold) {
      status = 'LOW_STOCK';
    }

    const created = await prisma.medicineInventory.create({
      data: {
        medicineId: input.medicineId,
        clinicId: input.clinicId,
        sku: input.sku,
        batchNumber: input.batchNumber,
        quantity: input.quantity,
        minThreshold: input.minThreshold,
        expiryDate: expiry,
        unitPrice: input.unitPrice,
        status,
      },
      include: {
        medicine: true,
        clinic: true,
      },
    });

    await prisma.medicineStockTransaction.create({
      data: {
        inventoryId: created.id,
        type: 'RECEIVED',
        quantityChange: input.quantity,
        previousQuantity: 0,
        newQuantity: input.quantity,
        reason: 'Initial stock intake',
        performedById,
      },
    });

    return created;
  }
}

