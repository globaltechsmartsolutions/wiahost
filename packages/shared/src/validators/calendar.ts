import { z } from "zod";
import { bookingChannels } from "../constants";

export const calendarBlockSchema = z
  .object({
    endDate: z.iso.date(),
    propertyId: z.guid(),
    reason: z.string().trim().min(3, "Indica el motivo del bloqueo."),
    source: z.enum(bookingChannels).default("manual"),
    startDate: z.iso.date(),
  })
  .refine(
    (value) =>
      new Date(value.endDate).getTime() > new Date(value.startDate).getTime(),
    {
      message: "La fecha final debe ser posterior a la inicial.",
      path: ["endDate"],
    },
  );

export type CalendarBlockInput = z.infer<typeof calendarBlockSchema>;
