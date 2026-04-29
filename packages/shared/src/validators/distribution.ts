import { z } from "zod";
import { bookingChannels, syncStatuses } from "../constants";

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
  z.string().trim().max(1000).optional(),
);
const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().trim().url("La URL del canal no es valida.").optional(),
);

const payloadSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value ?? {};
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return {};
    }

    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      return value;
    }
  },
  z.record(z.string(), z.unknown()),
);

export const listingSchema = z.object({
  channel: z.enum(bookingChannels),
  channelUrl: optionalUrl,
  externalListingId: optionalText,
  propertyId: z.guid("La propiedad no es valida."),
  publicSlug: optionalText,
  status: z
    .enum(["draft", "published", "paused", "sync_error"])
    .default("draft"),
  syncEnabled: z.coerce.boolean().default(false),
  syncNotes: optionalText,
  title: z
    .string()
    .trim()
    .min(3, "El titulo debe tener al menos 3 caracteres.")
    .max(160, "El titulo es demasiado largo."),
});

export const channelSyncEventSchema = z
  .object({
    channel: z.enum(bookingChannels),
    direction: z.enum(["inbound", "outbound"]),
    errorMessage: optionalText,
    listingId: optionalGuid,
    payload: payloadSchema.default({}),
    propertyId: optionalGuid,
    status: z.enum(syncStatuses).default("pending"),
  })
  .refine((input) => input.listingId || input.propertyId, {
    message: "Debes vincular el evento a una publicacion o a una propiedad.",
    path: ["listingId"],
  });

export const icalImportSchema = z.object({
  channel: z.enum(bookingChannels).default("manual"),
  icalText: z
    .string()
    .trim()
    .min(20, "El calendario iCal esta vacio o no es valido.")
    .max(200_000, "El calendario iCal es demasiado grande para este import."),
  propertyId: z.guid("La propiedad no es valida."),
  sourceName: z
    .string()
    .trim()
    .min(2, "El origen debe tener al menos 2 caracteres.")
    .max(80, "El origen es demasiado largo."),
});

export type ChannelSyncEventInput = z.infer<typeof channelSyncEventSchema>;
export type IcalImportInput = z.infer<typeof icalImportSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
