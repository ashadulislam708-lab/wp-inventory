import * as z from "zod";

export const stockAdjustmentSchema = z.object({
  quantity: z.coerce.number().refine((v) => v !== 0, "Quantity cannot be zero"),
  reason: z.string().min(1, "Reason is required"),
  note: z.string().optional(),
});

export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;
