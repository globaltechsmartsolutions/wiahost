import { z } from "zod";
import { messageChannels } from "../constants";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const optionalGuid = z.preprocess(emptyToUndefined, z.guid().optional());
const optionalText = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(500).optional(),
);

export const messageSchema = z.object({
  body: z.string().min(1, "El mensaje no puede estar vacio.").max(4000),
  channel: z.enum(messageChannels).default("inbox"),
  conversationId: z.guid(),
});

export const channelInboundMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "El mensaje no puede estar vacio.")
    .max(4000, "El mensaje es demasiado largo."),
  channel: z.enum(messageChannels).default("inbox"),
  externalMessageId: optionalText,
  guestEmail: z.preprocess(
    emptyToUndefined,
    z.email("El email no es valido.").optional(),
  ),
  guestFullName: z
    .string()
    .trim()
    .min(2, "El nombre del huesped debe tener al menos 2 caracteres.")
    .max(120, "El nombre es demasiado largo."),
  guestPhone: optionalText,
  propertyId: z.guid("La propiedad no es valida."),
  reservationId: optionalGuid,
  sentAt: optionalText,
});

export type ChannelInboundMessageInput = z.infer<
  typeof channelInboundMessageSchema
>;
export type MessageInput = z.infer<typeof messageSchema>;
