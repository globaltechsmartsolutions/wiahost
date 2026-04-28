import { z } from "zod";
import { paymentStatuses } from "../constants";

export const paymentSchema = z.object({
  amount: z.coerce.number().min(0, "El importe no puede ser negativo."),
  currency: z.string().trim().length(3).default("EUR"),
  paidAt: z.string().optional().or(z.literal("")),
  provider: z.string().trim().min(2, "Indica el proveedor del pago."),
  reservationId: z.guid(),
  status: z.enum(paymentStatuses).default("pending"),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
