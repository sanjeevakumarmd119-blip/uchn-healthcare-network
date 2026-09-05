import { z } from 'zod';

export const StockTransactionSchema = z.object({
  inventoryId: z.string().min(1, 'Inventory ID is required'),
  type: z.enum(['RECEIVED', 'DISPENSED', 'ADJUSTED', 'DISCARDED']),
  quantityChange: z.number().int('Quantity must be an integer').refine((val) => val !== 0, {
    message: 'Quantity change cannot be 0',
  }),
  reason: z.string().min(3, 'Reason is required (minimum 3 characters)'),
});

export const CreateInventoryItemSchema = z.object({
  medicineId: z.string().min(1, 'Medicine ID is required'),
  clinicId: z.string().min(1, 'Clinic ID is required'),
  sku: z.string().min(3, 'SKU is required'),
  batchNumber: z.string().min(2, 'Batch number is required'),
  quantity: z.number().int().nonnegative('Quantity cannot be negative'),
  minThreshold: z.number().int().positive('Threshold must be greater than 0').default(10),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative').default(10.0),
});

export type StockTransactionInput = z.infer<typeof StockTransactionSchema>;
export type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemSchema>;

