import { z } from "zod";
import { bookingChannels, reservationStatuses } from "../constants";

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

export const updateReservationStatusSchema = z.object({
  status: z.enum(reservationStatuses)
});

export type ReservationInput = z.infer<typeof reservationSchema>;
