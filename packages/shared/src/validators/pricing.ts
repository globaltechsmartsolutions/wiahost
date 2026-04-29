import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const optionalGuid = z.preprocess(emptyToUndefined, z.guid().optional());
const optionalNonNegativeNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(0, "El importe no puede ser negativo.").optional(),
);
const optionalRate = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number()
    .min(0, "La ocupacion no puede ser negativa.")
    .max(1, "La ocupacion debe estar entre 0 y 1.")
    .optional(),
);

export const pricingObservationSchema = z.object({
  approvedPrice: optionalNonNegativeNumber,
  bookingPace: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
  conversionStatus: z
    .enum(["unknown", "viewed", "inquiry", "booked", "lost", "cancelled"])
    .default("unknown"),
  currency: z
    .string()
    .trim()
    .length(3, "La moneda debe tener 3 caracteres.")
    .default("EUR"),
  currentPrice: optionalNonNegativeNumber,
  finalPrice: optionalNonNegativeNumber,
  leadTimeDays: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .int("El lead time debe ser un numero entero.")
      .min(0, "El lead time no puede ser negativo.")
      .optional(),
  ),
  observedFor: z.string().min(1, "La fecha de observacion es obligatoria."),
  occupancyRate: optionalRate,
  propertyId: z.guid("La propiedad no es valida."),
  reservationId: optionalGuid,
  source: z
    .string()
    .trim()
    .min(2, "El origen debe tener al menos 2 caracteres.")
    .max(80, "El origen es demasiado largo.")
    .default("manual"),
  suggestedPrice: optionalNonNegativeNumber,
});

export type PricingObservationInput = z.infer<typeof pricingObservationSchema>;
