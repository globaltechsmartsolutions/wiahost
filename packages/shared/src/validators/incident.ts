import { z } from "zod";
import { incidentStatuses } from "../constants";

export const incidentSchema = z.object({
  propertyId: z.uuid(),
  reservationId: z.uuid().optional(),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  description: z.string().min(10, "Describe mejor la incidencia.").max(3000),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  status: z.enum(incidentStatuses).default("open"),
  estimatedCost: z.coerce.number().min(0).optional()
});

export const updateIncidentStatusSchema = z.object({
  status: z.enum(incidentStatuses)
});

export type IncidentInput = z.infer<typeof incidentSchema>;
