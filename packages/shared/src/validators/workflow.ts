import { z } from "zod";
import { guestWorkflowTriggers } from "../constants";
import { automationRuleSchema } from "./automation";

export const guestWorkflowSchema = automationRuleSchema.extend({
  trigger: z.enum(guestWorkflowTriggers),
});

export type GuestWorkflowInput = z.infer<typeof guestWorkflowSchema>;
