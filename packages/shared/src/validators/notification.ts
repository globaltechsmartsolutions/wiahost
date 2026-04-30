import { z } from "zod";

export const notificationSchema = z.object({
  body: z.string().trim().max(1000).optional().or(z.literal("")),
  title: z
    .string()
    .trim()
    .min(3, "El titulo debe tener al menos 3 caracteres.")
    .max(160, "El titulo es demasiado largo."),
  type: z
    .string()
    .trim()
    .min(2, "El tipo de notificacion debe tener al menos 2 caracteres.")
    .max(80, "El tipo de notificacion es demasiado largo.")
    .optional(),
});

export const notificationPushSchema = notificationSchema.extend({
  channelId: z.string().trim().max(80).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  priority: z.enum(["default", "normal", "high"]).default("default"),
  userId: z.guid("El usuario destino no es valido."),
});

export type NotificationInput = z.infer<typeof notificationSchema>;
export type NotificationPushInput = z.infer<typeof notificationPushSchema>;
