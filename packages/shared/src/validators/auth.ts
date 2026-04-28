import { z } from "zod";
import { userRoles } from "../roles";

export const loginSchema = z.object({
  email: z.email("Introduce un email válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.")
});

export const registerSchema = loginSchema.extend({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  role: z.enum(userRoles).default("operator")
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
