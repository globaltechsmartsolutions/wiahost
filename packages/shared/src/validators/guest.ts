import { z } from "zod";

export const guestSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.email("Introduce un email válido.").optional().or(z.literal("")),
  phone: z.string().min(6).optional().or(z.literal("")),
  preferredLanguage: z.string().default("es"),
  notes: z.string().max(2000).optional()
});

export type GuestInput = z.infer<typeof guestSchema>;
