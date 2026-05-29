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
const scopesSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value ?? [];
    }

    return value
      .split(",")
      .map((scope) => scope.trim())
      .filter(Boolean);
  },
  z.array(z.string().trim().min(1).max(80)).max(20),
);
const optionalPartnerKey = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(12, "La clave debe tener al menos 12 caracteres.").max(240).optional(),
);
const partnerListSchema = (itemSchema: z.ZodString) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value ?? [];
      }

      return value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
    },
    z.array(itemSchema).max(20),
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

export const channelAccountSchema = z.object({
  accountLabel: z
    .string()
    .trim()
    .min(2, "El nombre de la cuenta debe tener al menos 2 caracteres.")
    .max(120, "El nombre de la cuenta es demasiado largo."),
  authMode: z
    .enum(["manual", "oauth", "api_key", "partner_api", "ical_only"])
    .default("manual"),
  channel: z.enum(bookingChannels),
  externalAccountId: optionalText,
  healthStatus: z.enum(syncStatuses).default("pending"),
  notes: optionalText,
  scopes: scopesSchema.default([]),
  status: z
    .enum([
      "planned",
      "pending_credentials",
      "connected",
      "needs_attention",
      "disabled",
    ])
    .default("planned"),
});

const partnerAppBaseSchema = z.object({
  allowedOrigins: partnerListSchema(
    z.string().trim().url("El dominio permitido no es valido."),
  ).default([]),
  apiKey: optionalPartnerKey,
  displayName: z
    .string()
    .trim()
    .min(2, "El nombre de la web debe tener al menos 2 caracteres.")
    .max(140, "El nombre de la web es demasiado largo."),
  notes: optionalText,
  partnerId: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9][a-z0-9_.-]{1,80}$/,
      "El partnerId solo puede usar minusculas, numeros, puntos, guiones y guiones bajos.",
    ),
  rateLimitPerMinute: z.coerce
    .number()
    .int()
    .min(1, "El limite debe ser positivo.")
    .max(10000, "El limite es demasiado alto.")
    .default(60),
  redirectUrls: partnerListSchema(
    z.string().trim().url("La URL de retorno no es valida."),
  ).default([]),
  scopes: scopesSchema.default([
    "listings",
    "availability",
    "inquiries",
    "reservations:read",
  ]),
  status: z.enum(["draft", "active", "paused", "revoked"]).default("draft"),
  webhookUrl: optionalUrl,
});

export const partnerAppSchema = partnerAppBaseSchema
  .refine((input) => input.status !== "active" || Boolean(input.apiKey), {
    message: "Para activar una web conectada debes indicar una clave.",
    path: ["apiKey"],
  });
export const partnerAppUpdateSchema = partnerAppBaseSchema;

export type ChannelAccountInput = z.infer<typeof channelAccountSchema>;
export type ChannelSyncEventInput = z.infer<typeof channelSyncEventSchema>;
export type IcalImportInput = z.infer<typeof icalImportSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type PartnerAppInput = z.infer<typeof partnerAppSchema>;
export type PartnerAppUpdateInput = z.infer<typeof partnerAppUpdateSchema>;
