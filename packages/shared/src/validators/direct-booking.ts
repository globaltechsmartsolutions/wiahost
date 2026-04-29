import { z } from "zod";

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(2000).optional(),
);

export const directBookingInquirySchema = z
  .object({
    checkIn: z.iso.date(),
    checkOut: z.iso.date(),
    consent: z.coerce.boolean().default(false),
    guestEmail: z.email("Introduce un email valido."),
    guestFullName: z
      .string()
      .trim()
      .min(2, "El nombre del huesped es obligatorio."),
    guestPhone: optionalText,
    guestsCount: z.coerce
      .number()
      .int()
      .min(1, "Debe haber al menos 1 huesped.")
      .max(30, "Para grupos grandes contacta con el equipo."),
    message: optionalText,
  })
  .refine(
    (value) =>
      new Date(value.checkOut).getTime() > new Date(value.checkIn).getTime(),
    {
      message: "La salida debe ser posterior a la entrada.",
      path: ["checkOut"],
    },
  )
  .refine((value) => value.consent, {
    message:
      "Debes aceptar que contactemos contigo para gestionar la solicitud.",
    path: ["consent"],
  });

export type DirectBookingInquiryInput = z.infer<
  typeof directBookingInquirySchema
>;
