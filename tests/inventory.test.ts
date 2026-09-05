import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/server/db';
import { InventoryService } from '../src/server/services/inventory.service';

describe('Medicine Inventory Service & Stock Constraints', () => {
  let adminUser: any;
  let clinic: any;
  let medicine: any;
  let inventoryItem: any;

  beforeAll(async () => {
    adminUser = await prisma.user.findFirst({
      where: { role: 'CLINIC_ADMIN' },
    });
    clinic = await prisma.clinic.findFirst();
    medicine = await prisma.medicine.findFirst();

    // Create a dedicated inventory item for testing
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 2);

    inventoryItem = await prisma.medicineInventory.create({
      data: {
        clinicId: clinic.id,
        medicineId: medicine.id,
        sku: `SKU-TEST-${Date.now()}`,
        batchNumber: `BAT-TEST-${Date.now()}`,
        quantity: 20,
        minThreshold: 10,
        expiryDate,
        unitPrice: 15.0,
        status: 'IN_STOCK',
      },
    });
  });

  afterAll(async () => {
    if (inventoryItem) {
      await prisma.medicineStockTransaction.deleteMany({
        where: { inventoryId: inventoryItem.id },
      });
      await prisma.medicineInventory.delete({
        where: { id: inventoryItem.id },
      }).catch(() => {});
    }
  });

  it('should increase quantity and log transaction on stock receipt (+15)', async () => {
    const result = await InventoryService.recordStockTransaction(
      {
        inventoryId: inventoryItem.id,
        type: 'RECEIVED',
        quantityChange: 15,
        reason: 'Restock batch delivery',
      },
      adminUser.id
    );

    expect(result.updatedInventory.quantity).toBe(35);
    expect(result.updatedInventory.status).toBe('IN_STOCK');
    expect(result.transaction.type).toBe('RECEIVED');
    expect(result.transaction.quantityChange).toBe(15);
  });

  it('should decrease quantity and trigger LOW_STOCK status when quantity drops below threshold (<=10)', async () => {
    // Dispense 27 units (from 35 -> 8)
    const result = await InventoryService.recordStockTransaction(
      {
        inventoryId: inventoryItem.id,
        type: 'DISPENSED',
        quantityChange: -27,
        reason: 'Prescriptions fulfilled',
      },
      adminUser.id
    );

    expect(result.updatedInventory.quantity).toBe(8);
    expect(result.updatedInventory.status).toBe('LOW_STOCK');
  });

  it('should strictly reject negative stock when requested dispense exceeds available quantity', async () => {
    // Current stock is 8, try to dispense 10
    await expect(
      InventoryService.recordStockTransaction(
        {
          inventoryId: inventoryItem.id,
          type: 'DISPENSED',
          quantityChange: -10,
          reason: 'Excessive dispense attempt',
        },
        adminUser.id
      )
    ).rejects.toThrow('Insufficient stock');
  });

  it('should set status to OUT_OF_STOCK when remaining stock reaches exactly 0', async () => {
    // Dispense remaining 8
    const result = await InventoryService.recordStockTransaction(
      {
        inventoryId: inventoryItem.id,
        type: 'DISPENSED',
        quantityChange: -8,
        reason: 'Final batch units dispensed',
      },
      adminUser.id
    );

    expect(result.updatedInventory.quantity).toBe(0);
    expect(result.updatedInventory.status).toBe('OUT_OF_STOCK');
  });
});

