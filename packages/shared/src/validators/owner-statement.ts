import { z } from "zod";
import { syncStatuses } from "../constants";

const optionalGuid = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.guid().optional(),
);

export const ownerStatementSchema = z
  .object({
    cleaningCosts: z.coerce
      .number()
      .min(0, "Los costes de limpieza no pueden ser negativos.")
      .default(0),
    grossRevenue: z.coerce
      .number()
      .min(0, "Los ingresos brutos no pueden ser negativos.")
      .default(0),
    maintenanceCosts: z.coerce
      .number()
      .min(0, "Los costes de mantenimiento no pueden ser negativos.")
      .default(0),
    netPayout: z.coerce.number().default(0),
    ownerAccountId: z.guid(),
    periodEnd: z.string().min(1, "Indica la fecha final del periodo."),
    periodStart: z.string().min(1, "Indica la fecha inicial del periodo."),
    platformFees: z.coerce
      .number()
      .min(0, "Las comisiones no pueden ser negativas.")
      .default(0),
    propertyId: optionalGuid,
    status: z.enum(syncStatuses).default("pending"),
  })
  .refine((value) => new Date(value.periodEnd) >= new Date(value.periodStart), {
    message: "La fecha final debe ser posterior o igual a la inicial.",
    path: ["periodEnd"],
  });

export type OwnerStatementInput = z.infer<typeof ownerStatementSchema>;
