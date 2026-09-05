import prisma from '../db';
import { RequestMedicineInput } from '../validators/medicine.validator';
import { calculateDistanceKm } from '../../lib/geo';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';

export interface MedicineSearchParams {
  search?: string;
  category?: string;
  userLat?: number;
  userLng?: number;
  clinicId?: string;
}

export class MedicineService {
  static async getCategories() {
    const medicines = await prisma.medicine.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return medicines.map((m) => m.category);
  }

  static async searchMedicines(params: MedicineSearchParams) {
    const { search, category, userLat, userLng, clinicId } = params;

    const whereClause: any = {};

    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { genericName: { contains: search } },
        { category: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const inventoryWhere: any = {};
    if (clinicId) {
      inventoryWhere.clinicId = clinicId;
    }

    const medicines = await prisma.medicine.findMany({
      where: whereClause,
      include: {
        inventory: {
          where: inventoryWhere,
          include: {
            clinic: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Map medicines to computed aggregate availability and nearby clinic breakdown
    return medicines.map((med) => {
      let totalStock = 0;
      const clinicAvailability = med.inventory.map((inv) => {
        totalStock += inv.quantity;
        let distanceKm: number | null = null;
        if (userLat !== undefined && userLng !== undefined && inv.clinic) {
          distanceKm = calculateDistanceKm(userLat, userLng, inv.clinic.latitude, inv.clinic.longitude);
        }

        return {
          inventoryId: inv.id,
          clinicId: inv.clinicId,
          clinicName: inv.clinic.name,
          clinicAddress: inv.clinic.address,
          quantity: inv.quantity,
          minThreshold: inv.minThreshold,
          unitPrice: inv.unitPrice,
          status: inv.quantity === 0 ? 'OUT_OF_STOCK' : inv.status,
          expiryDate: inv.expiryDate,
          distanceKm: distanceKm !== null ? parseFloat(distanceKm.toFixed(1)) : null,
        };
      });

      // Sort clinics by distance if available, otherwise by quantity
      clinicAvailability.sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        return b.quantity - a.quantity;
      });

      return {
        id: med.id,
        name: med.name,
        genericName: med.genericName,
        category: med.category,
        description: med.description,
        dosageForm: med.dosageForm,
        strength: med.strength,
        manufacturer: med.manufacturer,
        totalStock,
        isAvailable: totalStock > 0,
        clinics: clinicAvailability,
      };
    });
  }

  static async requestMedicine(
    patientProfileId: string,
    userId: string,
    input: RequestMedicineInput
  ) {
    // 1. Verify stock availability in target clinic
    const inventory = await prisma.medicineInventory.findFirst({
      where: {
        medicineId: input.medicineId,
        clinicId: input.clinicId,
      },
      include: {
        medicine: true,
        clinic: true,
      },
    });

    if (!inventory || inventory.quantity < input.quantity) {
      throw new Error(
        `Medicine is currently out of stock or requested quantity exceeds available stock (${inventory?.quantity || 0} available).`
      );
    }

    // 2. Create request
    const request = await prisma.medicineRequest.create({
      data: {
        patientId: patientProfileId,
        medicineId: input.medicineId,
        clinicId: input.clinicId,
        quantity: input.quantity,
        deliveryOption: input.deliveryOption,
        notes: input.notes || null,
        status: 'PENDING',
      },
      include: {
        medicine: true,
        clinic: true,
      },
    });

    // 3. Notify patient
    await NotificationService.create({
      userId,
      title: 'Medicine Request Submitted',
      message: `Your request for ${input.quantity}x ${inventory.medicine.name} at ${inventory.clinic.name} has been placed.`,
      type: 'INVENTORY',
      link: '/patient/medicines',
    });

    await AuditService.log({
      actorId: userId,
      action: 'MEDICINE_REQUESTED',
      entity: 'MedicineRequest',
      entityId: request.id,
      metadata: {
        medicine: inventory.medicine.name,
        clinic: inventory.clinic.name,
        quantity: input.quantity,
        deliveryOption: input.deliveryOption,
      },
    });

    return request;
  }

  static async getPatientRequests(patientProfileId: string) {
    return prisma.medicineRequest.findMany({
      where: { patientId: patientProfileId },
      include: {
        medicine: true,
        clinic: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

