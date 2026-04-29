import { z } from "zod";

export const checkoutConfirmationSchema = z.object({
  token: z.string().trim().min(32, "El token de checkout no es valido."),
});

export type CheckoutConfirmationInput = z.infer<
  typeof checkoutConfirmationSchema
>;
