import prisma from '../db';
import { BookAppointmentInput, UpdateAppointmentStatusInput } from '../validators/appointment.validator';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';
import { emitAppointmentUpdate } from '../socket';

export class AppointmentService {
  /**
   * Atomic slot booking with race condition / double-booking prevention
   */
  static async bookAppointment(
    patientProfileId: string,
    userId: string,
    input: BookAppointmentInput
  ) {
    const appointmentDate = new Date(input.appointmentDate);

    // Run within an atomic database transaction
    const appointment = await prisma.$transaction(
      async (tx) => {
        // 1. Fetch and verify slot with immediate availability check
        const slot = await tx.appointmentSlot.findUnique({
          where: { id: input.slotId },
          include: {
            doctor: {
              include: {
                user: true,
              },
            },
            clinic: true,
          },
        });

        if (!slot) {
          throw new Error('Appointment slot not found.');
        }

        if (slot.isBooked || slot.currentBookings >= slot.maxCapacity) {
          throw new Error(
            'This appointment slot has just been booked by another patient. Please choose another slot.'
          );
        }

        // 2. Lock slot
        await tx.appointmentSlot.update({
          where: { id: input.slotId },
          data: {
            isBooked: true,
            currentBookings: slot.currentBookings + 1,
          },
        });

        // 3. Generate unique appointment number
        const randSuffix = Math.floor(1000 + Math.random() * 9000);
        const appointmentNumber = `UCHN-APT-${Date.now().toString().slice(-4)}${randSuffix}`;

        // 4. Create appointment
        const newAppointment = await tx.appointment.create({
          data: {
            appointmentNumber,
            patientId: patientProfileId,
            doctorId: input.doctorId,
            clinicId: input.clinicId,
            slotId: input.slotId,
            appointmentDate,
            startTime: input.startTime,
            endTime: input.endTime,
            status: 'CONFIRMED',
            reason: input.reason,
            notes: input.notes || null,
          },
          include: {
            doctor: {
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
        });

        return newAppointment;
      },
      { maxWait: 15000, timeout: 20000 }
    );

    // 5. Post-transaction notifications & audit
    await NotificationService.create({
      userId: userId,
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${appointment.doctor.user.lastName} is confirmed for ${appointment.appointmentDate.toLocaleDateString()} at ${appointment.startTime} (${appointment.appointmentNumber}).`,
      type: 'APPOINTMENT',
      link: '/patient/appointments',
    });

    // Notify doctor
    if (appointment.doctor.user) {
      const doctorUser = await prisma.user.findFirst({
        where: { doctorProfile: { id: appointment.doctorId } },
      });
      if (doctorUser) {
        await NotificationService.create({
          userId: doctorUser.id,
          title: 'New Appointment Booked',
          message: `Patient ${appointment.patient.user.firstName} ${appointment.patient.user.lastName} booked an appointment for ${appointment.startTime} on ${appointment.appointmentDate.toLocaleDateString()}.`,
          type: 'APPOINTMENT',
          link: '/doctor/appointments',
        });
      }
    }

    await AuditService.log({
      actorId: userId,
      action: 'APPOINTMENT_CREATED',
      entity: 'Appointment',
      entityId: appointment.id,
      metadata: {
        appointmentNumber: appointment.appointmentNumber,
        doctorId: appointment.doctorId,
        clinicId: appointment.clinicId,
      },
    });

    emitAppointmentUpdate(appointment.clinicId, {
      type: 'CREATED',
      appointment,
    });

    return appointment;
  }

  static async getPatientAppointments(patientProfileId: string) {
    return prisma.appointment.findMany({
      where: { patientId: patientProfileId },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                avatarUrl: true,
              },
            },
            doctorSpecialties: {
              include: { specialty: true },
            },
          },
        },
        clinic: true,
        waitingQueueEntry: true,
      },
      orderBy: { appointmentDate: 'desc' },
    });
  }

  static async getDoctorAppointments(doctorId: string, dateStr?: string) {
    const where: any = { doctorId };

    if (dateStr) {
      const targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      where.appointmentDate = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    return prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        clinic: true,
        waitingQueueEntry: true,
      },
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
    });
  }

  static async getClinicAppointments(clinicId: string, dateStr?: string) {
    const where: any = { clinicId };

    if (dateStr) {
      const targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      where.appointmentDate = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    return prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
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
        waitingQueueEntry: true,
      },
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
    });
  }

  static async updateAppointmentStatus(
    appointmentId: string,
    input: UpdateAppointmentStatusInput,
    userId: string
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { slot: true, patient: { include: { user: true } } },
    });

    if (!appointment) {
      throw new Error('Appointment not found.');
    }

    const updated = await prisma.$transaction(
      async (tx) => {
        // If cancelling, release the slot
        if (input.status === 'CANCELLED' && appointment.slotId) {
          await tx.appointmentSlot.update({
            where: { id: appointment.slotId },
            data: {
              isBooked: false,
              currentBookings: { decrement: 1 },
            },
          });
        }

        return tx.appointment.update({
          where: { id: appointmentId },
          data: {
            status: input.status,
            notes: input.notes
              ? `${appointment.notes || ''}\n${input.notes}`.trim()
              : appointment.notes,
          },
          include: {
            doctor: { include: { user: true } },
            clinic: true,
            patient: { include: { user: true } },
          },
        });
      },
      { maxWait: 15000, timeout: 20000 }
    );

    // Notify patient
    await NotificationService.create({
      userId: appointment.patient.user.id,
      title: 'Appointment Status Updated',
      message: `Your appointment (${appointment.appointmentNumber}) is now marked as ${input.status}.`,
      type: 'APPOINTMENT',
      link: '/patient/appointments',
    });

    await AuditService.log({
      actorId: userId,
      action: 'APPOINTMENT_STATUS_CHANGED',
      entity: 'Appointment',
      entityId: appointmentId,
      metadata: { from: appointment.status, to: input.status },
    });

    emitAppointmentUpdate(updated.clinicId, {
      type: 'STATUS_UPDATED',
      appointment: updated,
    });

    return updated;
  }
}
