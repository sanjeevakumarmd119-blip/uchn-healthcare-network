import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/server/db';
import { requireAuth } from '@/server/auth/guards';
import { NotificationService } from '@/server/services/notification.service';
import { AuditService } from '@/server/services/audit.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req, ['DOCTOR', 'CLINIC_ADMIN']);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { medicine: { name: { contains: search, mode: 'insensitive' } } },
        { medicine: { genericName: { contains: search, mode: 'insensitive' } } },
        { patient: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { patient: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
        { patient: { user: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const requests = await prisma.medicineRequest.findMany({
      where,
      include: {
        medicine: true,
        clinic: true,
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: { requests },
    });
  } catch (error: any) {
    console.error('Failed to query medicine purchase records:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = requireAuth(req, ['DOCTOR', 'CLINIC_ADMIN']);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { requestId, status } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Missing requestId or status' },
        { status: 400 }
      );
    }

    const existing = await prisma.medicineRequest.findUnique({
      where: { id: requestId },
      include: {
        medicine: true,
        clinic: true,
        patient: {
          include: { user: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Medicine purchase request not found' },
        { status: 404 }
      );
    }

    // Update the request status
    const updated = await prisma.medicineRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        medicine: true,
        clinic: true,
        patient: {
          include: { user: true },
        },
      },
    });

    // If marked as DISPENSED, deduct inventory and log transaction if not already done
    if (status === 'DISPENSED' && existing.status !== 'DISPENSED') {
      const inventory = await prisma.medicineInventory.findFirst({
        where: {
          medicineId: existing.medicineId,
          clinicId: existing.clinicId,
        },
      });

      if (inventory) {
        const newQty = Math.max(0, inventory.quantity - existing.quantity);
        const newStatus =
          newQty === 0 ? 'OUT_OF_STOCK' : newQty <= inventory.minThreshold ? 'LOW_STOCK' : 'IN_STOCK';

        await prisma.medicineInventory.update({
          where: { id: inventory.id },
          data: {
            quantity: newQty,
            status: newStatus,
          },
        });

        await prisma.medicineStockTransaction.create({
          data: {
            inventoryId: inventory.id,
            type: 'DISPENSED',
            quantityChange: -existing.quantity,
            previousQuantity: inventory.quantity,
            newQuantity: newQty,
            reason: `Prescription medicine dispensed to patient ${existing.patient.user.firstName} ${existing.patient.user.lastName}`,
            performedById: auth.user.userId,
          },
        });
      }
    }

    // Notify patient
    await NotificationService.create({
      userId: existing.patient.userId,
      title: `Medicine Order ${status === 'DISPENSED' ? 'Dispensed' : status.replace('_', ' ')}`,
      message: `Your medicine reservation for ${existing.quantity}x ${existing.medicine.name} at ${existing.clinic.name} is now ${status.replace('_', ' ')}.`,
      type: 'INVENTORY',
      link: '/patient/medicines',
    });

    await AuditService.log({
      actorId: auth.user.userId,
      action: 'MEDICINE_DISPENSED_STATUS_UPDATED',
      entity: 'MedicineRequest',
      entityId: requestId,
      metadata: {
        medicine: existing.medicine.name,
        patient: `${existing.patient.user.firstName} ${existing.patient.user.lastName}`,
        status,
      },
    });

    return NextResponse.json({
      success: true,
      data: { request: updated },
    });
  } catch (error: any) {
    console.error('Failed to update medicine request status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
