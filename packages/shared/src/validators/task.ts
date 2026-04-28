import { z } from "zod";
import { taskStatuses } from "../constants";

export const taskSchema = z.object({
  propertyId: z.uuid(),
  reservationId: z.uuid().optional(),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  description: z.string().max(2000).optional(),
  type: z.enum(["cleaning", "maintenance", "inspection", "guest_request", "admin"]),
  status: z.enum(taskStatuses).default("open"),
  dueAt: z.iso.datetime().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal")
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(taskStatuses)
});

export type TaskInput = z.infer<typeof taskSchema>;
