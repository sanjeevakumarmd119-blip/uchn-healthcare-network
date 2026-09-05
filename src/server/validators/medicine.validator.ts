import { z } from 'zod';

export const RequestMedicineSchema = z.object({
  medicineId: z.string().min(1, 'Medicine ID is required'),
  clinicId: z.string().min(1, 'Clinic ID is required'),
  quantity: z.number().int().positive('Quantity must be at least 1').default(1),
  deliveryOption: z.enum(['PICKUP', 'HOME_DELIVERY']).default('PICKUP'),
  notes: z.string().optional(),
});

export type RequestMedicineInput = z.infer<typeof RequestMedicineSchema>;

