import { z } from "zod";

const optionalGuid = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.guid().optional(),
);

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(120).optional(),
);

export const documentSchema = z.object({
  incidentId: optionalGuid,
  mimeType: optionalText,
  propertyId: optionalGuid,
  reservationId: optionalGuid,
  storagePath: z
    .string()
    .trim()
    .min(3, "Indica la ruta del documento en storage.")
    .max(500, "La ruta del documento es demasiado larga.")
    .refine(
      (value) => !value.startsWith("/") && !value.includes(".."),
      "La ruta del documento no es segura.",
    ),
  title: z
    .string()
    .trim()
    .min(3, "El titulo debe tener al menos 3 caracteres.")
    .max(120, "El titulo no puede superar 120 caracteres."),
});

export const documentUploadUrlSchema = z.object({
  storagePath: z
    .string()
    .trim()
    .min(3, "Indica la ruta del documento en storage.")
    .max(500, "La ruta del documento es demasiado larga.")
    .refine(
      (value) => !value.startsWith("/") && !value.includes(".."),
      "La ruta del documento no es segura.",
    ),
  upsert: z.coerce.boolean().default(false),
});

export type DocumentInput = z.infer<typeof documentSchema>;
export type DocumentUploadUrlInput = z.infer<typeof documentUploadUrlSchema>;
