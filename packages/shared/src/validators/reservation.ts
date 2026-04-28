import { z } from "zod";
import { bookingChannels, reservationStatuses } from "../constants";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(2000).optional(),
);

export const reservationSchema = z.object({
  propertyId: z.uuid(),
  guestId: z.uuid(),
  channel: z.enum(bookingChannels),
  status: z.enum(reservationStatuses).default("confirmed"),
  checkIn: z.iso.date(),
  checkOut: z.iso.date(),
  guestsCount: z.coerce.number().int().min(1),
  nightlyRate: z.coerce.number().min(0),
  cleaningFee: z.coerce.number().min(0).default(0),
  totalAmount: z.coerce.number().min(0),
  notes: z.string().max(2000).optional()
});

export const manualReservationSchema = z
  .object({
    propertyId: z.uuid(),
    guestFullName: z.string().trim().min(2, "El nombre del huesped es obligatorio."),
    guestEmail: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.email("Introduce un email valido.").optional(),
    ),
    guestPhone: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.string().trim().max(40).optional(),
    ),
    channel: z.enum(bookingChannels).default("manual"),
    status: z.enum(reservationStatuses).default("confirmed"),
    checkIn: z.iso.date(),
    checkOut: z.iso.date(),
    guestsCount: z.coerce.number().int().min(1),
    nightlyRate: z.coerce.number().min(0),
    cleaningFee: z.coerce.number().min(0).default(0),
    taxesAmount: z.coerce.number().min(0).default(0),
    securityDeposit: z.coerce.number().min(0).default(0),
    notes: optionalText,
  })
  .refine((value) => new Date(value.checkOut).getTime() > new Date(value.checkIn).getTime(), {
    message: "La salida debe ser posterior a la entrada.",
    path: ["checkOut"],
  });

export const updateReservationStatusSchema = z.object({
  status: z.enum(reservationStatuses)
});

export type ReservationInput = z.infer<typeof reservationSchema>;
export type ManualReservationInput = z.infer<typeof manualReservationSchema>;
