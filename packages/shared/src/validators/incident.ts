import { z } from "zod";
import { incidentStatuses, severities } from "../constants";

const optionalUuid = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.guid().optional(),
);

const optionalNumber = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.coerce.number().min(0).optional(),
);

export const incidentSchema = z.object({
  propertyId: z.guid(),
  reservationId: optionalUuid,
  title: z.string().trim().min(3, "El titulo debe tener al menos 3 caracteres."),
  description: z.string().trim().min(10, "Describe mejor la incidencia.").max(3000),
  severity: z.enum(severities).default("medium"),
  status: z.enum(incidentStatuses).default("open"),
  estimatedCost: optionalNumber,
});

export const updateIncidentStatusSchema = z.object({
  status: z.enum(incidentStatuses),
});

export type IncidentInput = z.infer<typeof incidentSchema>;
