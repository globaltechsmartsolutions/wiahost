import { z } from "zod";

export const propertySchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  internalName: z.string().optional(),
  description: z.string().max(2000).optional(),
  addressLine: z.string().min(3, "La dirección es obligatoria."),
  city: z.string().min(2, "La ciudad es obligatoria."),
  province: z.string().optional(),
  country: z.string().default("España"),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().min(0),
  maxGuests: z.coerce.number().int().min(1),
  basePrice: z.coerce.number().min(0),
  cleaningFee: z.coerce.number().min(0).default(0),
  status: z.enum(["draft", "active", "paused", "archived"]).default("draft")
});

export type PropertyInput = z.infer<typeof propertySchema>;
