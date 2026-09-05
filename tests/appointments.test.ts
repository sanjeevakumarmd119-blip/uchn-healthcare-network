import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/server/db';
import { AppointmentService } from '../src/server/services/appointment.service';

describe('Appointment Service & Double Booking Prevention', () => {
  let doctor: any;
  let clinic: any;
  let patient1: any;
  let patient2: any;
  let testSlot: any;

  beforeAll(async () => {
    clinic = await prisma.clinic.findFirst();
    doctor = await prisma.doctorProfile.findFirst({
      include: { user: true },
    });
    const patients = await prisma.patientProfile.findMany({
      take: 2,
      include: { user: true },
    });
    patient1 = patients[0];
    patient2 = patients[1];

    // Create a dedicated fresh appointment slot for testing
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 10);
    startTime.setHours(11, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(30);

    testSlot = await prisma.appointmentSlot.create({
      data: {
        doctorId: doctor.id,
        clinicId: clinic.id,
        startTime,
        endTime,
        isBooked: false,
        maxCapacity: 1,
        currentBookings: 0,
        price: 75.0,
      },
    });
  });

  afterAll(async () => {
    if (testSlot) {
      await prisma.appointment.deleteMany({ where: { slotId: testSlot.id } });
      await prisma.appointmentSlot.delete({ where: { id: testSlot.id } }).catch(() => {});
    }
  });

  it('should book an available appointment slot atomically and lock it', async () => {
    const apt = await AppointmentService.bookAppointment(
      patient1.id,
      patient1.user.id,
      {
        slotId: testSlot.id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        appointmentDate: testSlot.startTime.toISOString().split('T')[0],
        startTime: '11:00 AM',
        endTime: '11:30 AM',
        reason: 'Clinical Cardiology Review',
      }
    );

    expect(apt).toBeDefined();
    expect(apt.appointmentNumber.startsWith('UCHN-APT-')).toBe(true);
    expect(apt.status).toBe('CONFIRMED');

    // Verify slot is now locked in DB
    const lockedSlot = await prisma.appointmentSlot.findUnique({
      where: { id: testSlot.id },
    });
    expect(lockedSlot?.isBooked).toBe(true);
    expect(lockedSlot?.currentBookings).toBe(1);
  });

  it('should prevent double booking when another patient attempts to book the same locked slot', async () => {
    await expect(
      AppointmentService.bookAppointment(
        patient2.id,
        patient2.user.id,
        {
          slotId: testSlot.id,
          doctorId: doctor.id,
          clinicId: clinic.id,
          appointmentDate: testSlot.startTime.toISOString().split('T')[0],
          startTime: '11:00 AM',
          endTime: '11:30 AM',
          reason: 'Attempted concurrent booking',
        }
      )
    ).rejects.toThrow('This appointment slot has just been booked by another patient.');
  });

  it('should allow status update to CANCELLED and release slot back to available pool', async () => {
    const existingApt = await prisma.appointment.findFirst({
      where: { slotId: testSlot.id },
    });

    if (!existingApt) throw new Error('Existing appointment missing');

    const updated = await AppointmentService.updateAppointmentStatus(
      existingApt.id,
      { status: 'CANCELLED', notes: 'Patient rescheduled' },
      patient1.user.id
    );

    expect(updated.status).toBe('CANCELLED');

    // Verify slot is released
    const releasedSlot = await prisma.appointmentSlot.findUnique({
      where: { id: testSlot.id },
    });
    expect(releasedSlot?.isBooked).toBe(false);
    expect(releasedSlot?.currentBookings).toBe(0);
  });
});

