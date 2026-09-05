import prisma from '../db';
import { CheckInQueueInput, UpdateQueueStatusInput } from '../validators/queue.validator';
import { NotificationService } from './notification.service';
import { emitQueueUpdate, emitToUser } from '../socket';

export class QueueService {
  static async checkInPatient(input: CheckInQueueInput, performedById: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: input.appointmentId },
      include: {
        patient: { include: { user: true } },
        doctor: true,
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found.');
    }

    // Check if already in queue
    const existingQueue = await prisma.waitingQueue.findUnique({
      where: { appointmentId: input.appointmentId },
    });

    if (existingQueue && existingQueue.status !== 'CANCELLED') {
      return existingQueue;
    }

    // Get highest queue number today for this doctor
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const latestQueueEntry = await prisma.waitingQueue.findFirst({
      where: {
        doctorId: appointment.doctorId,
        createdAt: { gte: today },
      },
      orderBy: { queueNumber: 'desc' },
    });

    const nextQueueNumber = (latestQueueEntry?.queueNumber || 0) + 1;

    // Estimate wait time based on waiting patients ahead
    const activeWaitingCount = await prisma.waitingQueue.count({
      where: {
        doctorId: appointment.doctorId,
        status: 'WAITING',
      },
    });
    const estimatedWaitMinutes = Math.max(5, (activeWaitingCount + 1) * 15);

    const queueEntry = await prisma.$transaction(async (tx) => {
      // Update appointment status to CHECKED_IN
      await tx.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CHECKED_IN' },
      });

      return tx.waitingQueue.create({
        data: {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          clinicId: appointment.clinicId,
          doctorId: appointment.doctorId,
          queueNumber: nextQueueNumber,
          status: 'WAITING',
          estimatedWaitMinutes,
          triagePriority: input.triagePriority || 'NORMAL',
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
                },
              },
            },
          },
          appointment: true,
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
        },
      });
    });

    await NotificationService.create({
      userId: appointment.patient.user.id,
      title: 'Checked In Successfully',
      message: `You are #${queueEntry.queueNumber} in the waiting list. Estimated wait: ~${queueEntry.estimatedWaitMinutes} minutes.`,
      type: 'QUEUE',
      link: '/patient/queue',
    });

    emitQueueUpdate(appointment.clinicId, {
      type: 'CHECKED_IN',
      queueEntry,
    });

    return queueEntry;
  }

  static async updateQueueStatus(input: UpdateQueueStatusInput, changedById: string) {
    const queueItem = await prisma.waitingQueue.findUnique({
      where: { id: input.queueId },
      include: {
        appointment: true,
        patient: { include: { user: true } },
      },
    });

    if (!queueItem) {
      throw new Error('Queue entry not found.');
    }

    const dataToUpdate: any = { status: input.status };
    if (input.status === 'IN_CONSULTATION') {
      dataToUpdate.startTime = new Date();
    } else if (input.status === 'COMPLETED' || input.status === 'CANCELLED') {
      dataToUpdate.endTime = new Date();
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedQueue = await tx.waitingQueue.update({
        where: { id: input.queueId },
        data: dataToUpdate,
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
          appointment: true,
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
        },
      });

      // Mirror status on Appointment if linked
      if (queueItem.appointmentId) {
        let aptStatus = 'CHECKED_IN';
        if (input.status === 'IN_CONSULTATION') aptStatus = 'IN_PROGRESS';
        else if (input.status === 'COMPLETED') aptStatus = 'COMPLETED';
        else if (input.status === 'CANCELLED') aptStatus = 'CANCELLED';

        await tx.appointment.update({
          where: { id: queueItem.appointmentId },
          data: { status: aptStatus },
        });
      }

      return updatedQueue;
    });

    // Notify patient
    if (queueItem.patient?.user?.id) {
      let title = 'Queue Status Update';
      let message = `Your queue status is now ${input.status}.`;

      if (input.status === 'IN_CONSULTATION') {
        title = 'Doctor Ready — Please Proceed';
        message = 'The doctor is ready for your consultation. Please proceed to the examination room.';
      } else if (input.status === 'COMPLETED') {
        title = 'Consultation Completed';
        message = 'Your consultation has concluded. Thank you for visiting UCHN.';
      }

      await NotificationService.create({
        userId: queueItem.patient.user.id,
        title,
        message,
        type: 'QUEUE',
        link: '/patient/queue',
      });

      emitToUser(queueItem.patient.user.id, 'queue:patient_update', updated);
    }

    emitQueueUpdate(queueItem.clinicId, {
      type: 'STATUS_CHANGED',
      queueEntry: updated,
    });

    return updated;
  }

  static async getClinicQueue(clinicId: string, doctorId?: string) {
    const where: any = {
      clinicId,
      status: { in: ['WAITING', 'IN_CONSULTATION'] },
    };

    if (doctorId) {
      where.doctorId = doctorId;
    }

    return prisma.waitingQueue.findMany({
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
              },
            },
          },
        },
        appointment: true,
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
      },
      orderBy: [
        { triagePriority: 'desc' }, // CRITICAL, URGENT, NORMAL
        { queueNumber: 'asc' },
      ],
    });
  }

  static async getPatientQueueStatus(patientProfileId: string) {
    return prisma.waitingQueue.findFirst({
      where: {
        patientId: patientProfileId,
        status: { in: ['WAITING', 'IN_CONSULTATION'] },
      },
      include: {
        appointment: true,
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
        clinic: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

