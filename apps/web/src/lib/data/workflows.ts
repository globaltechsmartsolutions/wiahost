import {
  guestWorkflowTriggers,
  supportedTemplateVariables,
} from "@wiahost/shared";

import {
  getAutomationRuleDetail,
  getAutomationRules,
  type AutomationRuleDetail,
} from "@/lib/data/automations";

export const workflowStages = [
  {
    description:
      "Confirma la reserva, abre el hilo correcto y deja claras las proximas acciones.",
    label: "Reserva confirmada",
    recommendedChannel: "email",
    trigger: "reservation_confirmed",
  },
  {
    description:
      "Envia instrucciones, normas, acceso, parking y contacto antes de la llegada.",
    label: "Check-in 24h antes",
    recommendedChannel: "whatsapp",
    trigger: "checkin_24h",
  },
  {
    description:
      "Refuerza codigo de cerradura, llegada estimada y fallback si algo falla.",
    label: "Check-in 1h antes",
    recommendedChannel: "whatsapp",
    trigger: "checkin_1h",
  },
  {
    description:
      "Coordina salida, recordatorio de llaves, limpieza y siguiente reserva.",
    label: "Hora de check-out",
    recommendedChannel: "inbox",
    trigger: "checkout_time",
  },
] as const;

const workflowTriggerValues = guestWorkflowTriggers as readonly string[];

export const workflowChannelOptions = [
  { label: "Inbox", value: "inbox" },
  { label: "Email", value: "email" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "SMS", value: "sms" },
  { label: "Airbnb", value: "airbnb" },
  { label: "Booking", value: "booking" },
  { label: "Vrbo", value: "vrbo" },
];

export const workflowTriggerOptions = workflowStages.map((stage) => ({
  label: stage.label,
  value: stage.trigger,
}));

export const workflowTemplateVariables = supportedTemplateVariables.map(
  (variable) => `{{${variable}}}`,
);

export type GuestWorkflow = AutomationRuleDetail & {
  phase: string;
  recommendation: string;
  variables: string[];
};

function isGuestWorkflowTrigger(trigger: string) {
  return workflowTriggerValues.includes(trigger);
}

function stageForTrigger(trigger: string) {
  return (
    workflowStages.find((stage) => stage.trigger === trigger) ??
    workflowStages[0]
  );
}

function enrichWorkflow(rule: AutomationRuleDetail): GuestWorkflow {
  const stage = stageForTrigger(rule.raw.trigger);

  return {
    ...rule,
    phase: stage.label,
    recommendation: stage.description,
    variables: rule.variables.length
      ? rule.variables
      : ["Sin variables dinamicas"],
  };
}

export async function getGuestWorkflows(): Promise<GuestWorkflow[]> {
  const rules = await getAutomationRules();

  return rules
    .filter((rule) => isGuestWorkflowTrigger(rule.raw.trigger))
    .map(enrichWorkflow);
}

export async function getGuestWorkflowDetail(
  workflowId: string,
): Promise<GuestWorkflow | null> {
  const rule = await getAutomationRuleDetail(workflowId);

  if (!rule || !isGuestWorkflowTrigger(rule.raw.trigger)) {
    return null;
  }

  return enrichWorkflow(rule);
}
