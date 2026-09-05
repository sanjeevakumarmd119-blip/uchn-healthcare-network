import prisma from '../db';
import { CreateEmergencyInput, UpdateEmergencyStatusInput } from '../validators/emergency.validator';
import { calculateDistanceKm } from '../../lib/geo';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';
import { emitEmergencyBroadcast, emitToClinic, emitToUser } from '../socket';

export class EmergencyService {
  static async createEmergency(
    patientProfileId: string,
    userId: string,
    input: CreateEmergencyInput
  ) {
    // 1. Locate nearest clinic if clinicId not directly specified
    let targetClinicId = input.clinicId;
    if (!targetClinicId) {
      const clinics = await prisma.clinic.findMany({
        where: { isActive: true },
      });

      if (clinics.length > 0) {
        let minDistance = Infinity;
        for (const c of clinics) {
          const dist = calculateDistanceKm(input.latitude, input.longitude, c.latitude, c.longitude);
          if (dist < minDistance) {
            minDistance = dist;
            targetClinicId = c.id;
          }
        }
      }
    }

    // 2. Generate unique emergency case number
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const caseNumber = `UCHN-EMG-${randSuffix}`;

    // 3. Create Emergency Case & initial status history in a transaction
    const emergencyCase = await prisma.$transaction(async (tx) => {
      const created = await tx.emergencyCase.create({
        data: {
          caseNumber,
          patientId: patientProfileId,
          clinicId: targetClinicId || null,
          latitude: input.latitude,
          longitude: input.longitude,
          address: input.address || null,
          severity: input.severity || 'CRITICAL',
          emergencyType: input.emergencyType,
          description: input.description || null,
          status: 'PENDING',
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
          clinic: true,
        },
      });

      await tx.emergencyStatusHistory.create({
        data: {
          emergencyCaseId: created.id,
          status: 'PENDING',
          notes: 'Emergency SOS initiated by patient.',
          timestamp: new Date(),
        },
      });

      return created;
    });

    // 4. Send notifications
    await NotificationService.create({
      userId: userId,
      title: 'Emergency Request Received',
      message: `Your emergency request (${emergencyCase.caseNumber}) has been received. Our medical coordination team is routing immediate assistance.`,
      type: 'EMERGENCY',
      link: '/patient/emergency',
    });

    // Notify Clinic Staff / Admins
    if (emergencyCase.clinicId) {
      const staffMembers = await prisma.clinicStaff.findMany({
        where: { clinicId: emergencyCase.clinicId },
      });
      for (const staff of staffMembers) {
        await NotificationService.create({
          userId: staff.userId,
          title: `🚨 EMERGENCY ALERT: ${emergencyCase.emergencyType}`,
          message: `Critical Emergency Case ${emergencyCase.caseNumber} reported at ${emergencyCase.address || 'Patient Coordinates'}. Immediate action required.`,
          type: 'EMERGENCY',
          link: '/doctor/emergency',
        });
      }
    }

    await AuditService.log({
      actorId: userId,
      action: 'EMERGENCY_TRIGGERED',
      entity: 'EmergencyCase',
      entityId: emergencyCase.id,
      metadata: {
        caseNumber: emergencyCase.caseNumber,
        severity: emergencyCase.severity,
        type: emergencyCase.emergencyType,
      },
    });

    // 5. Emit real-time broadcasts
    emitEmergencyBroadcast({
      type: 'NEW_EMERGENCY',
      emergencyCase,
    });

    if (emergencyCase.clinicId) {
      emitToClinic(emergencyCase.clinicId, 'emergency:new', emergencyCase);
    }

    return emergencyCase;
  }

  static async updateEmergencyStatus(
    emergencyCaseId: string,
    input: UpdateEmergencyStatusInput,
    changedById: string
  ) {
    const existing = await prisma.emergencyCase.findUnique({
      where: { id: emergencyCaseId },
      include: {
        patient: { include: { user: true } },
      },
    });

    if (!existing) {
      throw new Error('Emergency case not found.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedCase = await tx.emergencyCase.update({
        where: { id: emergencyCaseId },
        data: {
          status: input.status,
          doctorId: input.doctorId !== undefined ? input.doctorId : existing.doctorId,
          clinicId: input.clinicId !== undefined ? input.clinicId : existing.clinicId,
          ambulanceId: input.ambulanceId !== undefined ? input.ambulanceId : existing.ambulanceId,
          notes: input.notes ? `${existing.notes || ''}\n${input.notes}`.trim() : existing.notes,
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
          clinic: true,
          doctor: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          statusHistory: {
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      await tx.emergencyStatusHistory.create({
        data: {
          emergencyCaseId,
          status: input.status,
          changedById,
          notes: input.notes || `Status transitioned to ${input.status}`,
          timestamp: new Date(),
        },
      });

      return updatedCase;
    });

    // Friendly message for patient based on status
    const statusMessages: Record<string, string> = {
      ASSIGNED: `Your emergency case has been assigned to ${updated.clinic?.name || 'the medical response team'}.`,
      AMBULANCE_DISPATCHED: `Ambulance unit ${updated.ambulanceId || '104'} has been dispatched to your location. Stay calm and keep phone line open.`,
      IN_PROGRESS: 'Medical personnel have arrived and care is in progress.',
      RESOLVED: 'Emergency case has been marked as resolved.',
      CANCELLED: 'Emergency request has been cancelled.',
    };

    if (existing.patient?.user?.id) {
      await NotificationService.create({
        userId: existing.patient.user.id,
        title: `Emergency Update: ${input.status.replace(/_/g, ' ')}`,
        message: statusMessages[input.status] || `Emergency status updated to ${input.status}.`,
        type: 'EMERGENCY',
        link: '/patient/emergency',
      });

      // Real-time emit to patient's private socket room
      emitToUser(existing.patient.user.id, 'emergency:status_update', updated);
    }

    await AuditService.log({
      actorId: changedById,
      action: 'EMERGENCY_STATUS_CHANGED',
      entity: 'EmergencyCase',
      entityId: emergencyCaseId,
      metadata: { from: existing.status, to: input.status, caseNumber: existing.caseNumber },
    });

    // Real-time broadcast to all doctors/clinics
    emitEmergencyBroadcast({
      type: 'STATUS_UPDATE',
      emergencyCase: updated,
    });

    return updated;
  }

  static async getActiveEmergencies(clinicId?: string) {
    const where: any = {
      status: {
        in: ['PENDING', 'ASSIGNED', 'AMBULANCE_DISPATCHED', 'IN_PROGRESS'],
      },
    };

    if (clinicId) {
      where.OR = [
        { clinicId: clinicId },
        { clinicId: null }, // unassigned pending cases should show to all clinics
      ];
    }

    return prisma.emergencyCase.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        clinic: true,
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: { timestamp: 'asc' },
          include: {
            changedBy: {
              select: {
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: [
        { severity: 'asc' }, // CRITICAL first
        { createdAt: 'desc' },
      ],
    });
  }

  static async getPatientEmergencies(patientProfileId: string) {
    return prisma.emergencyCase.findMany({
      where: { patientId: patientProfileId },
      include: {
        clinic: true,
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: { timestamp: 'asc' },
          include: {
            changedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getEmergencyById(emergencyCaseId: string) {
    return prisma.emergencyCase.findUnique({
      where: { id: emergencyCaseId },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        clinic: true,
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: { timestamp: 'asc' },
          include: {
            changedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }
}

