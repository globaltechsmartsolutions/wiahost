import { z } from "zod";

export const messageSchema = z.object({
  conversationId: z.guid(),
  body: z.string().min(1, "El mensaje no puede estar vacío.").max(4000),
  channel: z.enum(["inbox", "email", "whatsapp", "sms", "airbnb", "booking", "vrbo"]).default("inbox")
});

export type MessageInput = z.infer<typeof messageSchema>;
