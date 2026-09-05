import { z } from 'zod';

export const BookAppointmentSchema = z.object({
  slotId: z.string().min(1, 'Slot ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  clinicId: z.string().min(1, 'Clinic ID is required'),
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  reason: z.string().min(3, 'Please provide a reason for the consultation (minimum 3 characters)'),
  notes: z.string().optional(),
});

export const UpdateAppointmentStatusSchema = z.object({
  status: z.enum([
    'AVAILABLE',
    'HELD',
    'CONFIRMED',
    'CHECKED_IN',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ]),
  notes: z.string().optional(),
});

export type BookAppointmentInput = z.infer<typeof BookAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof UpdateAppointmentStatusSchema>;

