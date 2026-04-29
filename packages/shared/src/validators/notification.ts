import { z } from "zod";

export const notificationSchema = z.object({
  body: z.string().trim().max(1000).optional().or(z.literal("")),
  title: z
    .string()
    .trim()
    .min(3, "El titulo debe tener al menos 3 caracteres.")
    .max(160, "El titulo es demasiado largo."),
});

export type NotificationInput = z.infer<typeof notificationSchema>;
