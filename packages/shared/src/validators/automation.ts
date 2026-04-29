import { z } from "zod";
import { automationTriggers, messageChannels } from "../constants";

export const automationRuleSchema = z.object({
  channel: z.enum(messageChannels).default("email"),
  delayMinutes: z.coerce
    .number()
    .int()
    .min(0, "El retraso no puede ser negativo.")
    .max(10080, "El retraso maximo es de 7 dias."),
  enabled: z.coerce.boolean().default(true),
  name: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres."),
  template: z
    .string()
    .trim()
    .min(10, "La plantilla debe tener al menos 10 caracteres.")
    .max(4000, "La plantilla es demasiado larga."),
  trigger: z.enum(automationTriggers),
});

export const automationRunSchema = z.object({
  reservationId: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.guid().optional(),
  ),
});

export type AutomationRuleInput = z.infer<typeof automationRuleSchema>;
export type AutomationRunInput = z.infer<typeof automationRunSchema>;
