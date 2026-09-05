import { z } from 'zod';

export const CreateEmergencySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  severity: z.enum(['CRITICAL', 'SEVERE', 'MODERATE']).default('CRITICAL'),
  emergencyType: z.string().min(2, 'Emergency type is required (e.g., Cardiac, Trauma, Breathing, Stroke, General)'),
  description: z.string().optional(),
  clinicId: z.string().optional(),
});

export const UpdateEmergencyStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'ASSIGNED',
    'AMBULANCE_DISPATCHED',
    'IN_PROGRESS',
    'RESOLVED',
    'CANCELLED',
  ]),
  doctorId: z.string().optional(),
  clinicId: z.string().optional(),
  ambulanceId: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateEmergencyInput = z.infer<typeof CreateEmergencySchema>;
export type UpdateEmergencyStatusInput = z.infer<typeof UpdateEmergencyStatusSchema>;

