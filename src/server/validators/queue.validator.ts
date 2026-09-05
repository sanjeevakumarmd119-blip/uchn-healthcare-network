import { z } from 'zod';

export const CheckInQueueSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  triagePriority: z.enum(['NORMAL', 'URGENT', 'CRITICAL']).default('NORMAL'),
});

export const UpdateQueueStatusSchema = z.object({
  queueId: z.string().min(1, 'Queue ID is required'),
  status: z.enum(['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED']),
});

export type CheckInQueueInput = z.infer<typeof CheckInQueueSchema>;
export type UpdateQueueStatusInput = z.infer<typeof UpdateQueueStatusSchema>;

