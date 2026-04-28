import { z } from "zod";

export const guestSchema = z.object({
  email: z.email("Introduce un email valido.").optional().or(z.literal("")),
  fullName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres."),
  notes: z.string().max(2000).optional().or(z.literal("")),
  phone: z.string().trim().min(6).optional().or(z.literal("")),
  preferredLanguage: z.string().default("es"),
});

export type GuestInput = z.infer<typeof guestSchema>;
