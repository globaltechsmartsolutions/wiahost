import { z } from "zod";
import { severities, taskStatuses } from "../constants";

const optionalText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(2000).optional(),
);

const optionalUuid = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.uuid().optional(),
);

const optionalDateTime = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional(),
);

export const taskSchema = z.object({
  propertyId: z.uuid(),
  reservationId: optionalUuid,
  title: z.string().trim().min(3, "El titulo debe tener al menos 3 caracteres."),
  description: optionalText,
  type: z.enum(["cleaning", "maintenance", "inspection", "guest_request", "admin"]),
  status: z.enum(taskStatuses).default("open"),
  dueAt: optionalDateTime,
  priority: z.enum(severities).default("medium"),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(taskStatuses),
});

export type TaskInput = z.infer<typeof taskSchema>;
