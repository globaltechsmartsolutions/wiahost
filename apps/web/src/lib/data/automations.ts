import { automationRules as demoAutomationRules } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AutomationRuleItem = (typeof demoAutomationRules)[number];

type AutomationRuleRow = {
  channel: string;
  delay_minutes: number;
  enabled: boolean;
  id: string;
  name: string;
  template: string;
  trigger: string;
};

export type AutomationRuleDetail = AutomationRuleItem & {
  channel: string;
  id: string;
  raw: {
    channel: string;
    delayMinutes: number;
    enabled: boolean;
    name: string;
    template: string;
    trigger: string;
  };
  template: string;
};

export const triggerOptions = [
  { label: "Reserva confirmada", value: "reservation_confirmed" },
  { label: "Check-in 24h antes", value: "checkin_24h" },
  { label: "Check-in 1h antes", value: "checkin_1h" },
  { label: "Hora de check-out", value: "checkout_time" },
  { label: "Limpieza completada", value: "cleaning_completed" },
  { label: "Mensaje sin responder", value: "message_unanswered" },
  { label: "Alerta de ruido", value: "noise_alert" },
  { label: "Cancelacion", value: "cancellation" },
  { label: "Review baja", value: "low_review" },
];

export const channelOptions = [
  { label: "Inbox", value: "inbox" },
  { label: "Email", value: "email" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "SMS", value: "sms" },
  { label: "Airbnb", value: "airbnb" },
  { label: "Booking", value: "booking" },
  { label: "Vrbo", value: "vrbo" },
];

const fallbackAutomationRules: AutomationRuleDetail[] = demoAutomationRules.map(
  (rule, index) => ({
    ...rule,
    channel: index === 1 ? "Inbox" : "Email",
    id: `demo-automation-${index + 1}`,
    raw: {
      channel: index === 1 ? "inbox" : "email",
      delayMinutes: index === 2 ? 30 : 0,
      enabled: rule.status === "Activa",
      name: rule.name,
      template: `Plantilla demo para ${rule.name}.`,
      trigger:
        index === 0
          ? "checkin_24h"
          : index === 1
            ? "checkin_1h"
            : "checkout_time",
    },
    template: `Plantilla demo para ${rule.name}.`,
  }),
);

function labelFromOptions(
  options: Array<{ label: string; value: string }>,
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function delayLabel(delayMinutes: number) {
  if (!delayMinutes) {
    return "Ejecucion inmediata";
  }

  if (delayMinutes < 60) {
    return `${delayMinutes} min de espera`;
  }

  const hours = Math.round(delayMinutes / 60);
  return `${hours} h de espera`;
}

function mapAutomationRule(row: AutomationRuleRow): AutomationRuleDetail {
  return {
    channel: labelFromOptions(channelOptions, row.channel),
    id: row.id,
    impact: delayLabel(row.delay_minutes),
    name: row.name,
    raw: {
      channel: row.channel,
      delayMinutes: row.delay_minutes,
      enabled: row.enabled,
      name: row.name,
      template: row.template,
      trigger: row.trigger,
    },
    status: row.enabled ? "Activa" : "Pausada",
    template: row.template,
    trigger: labelFromOptions(triggerOptions, row.trigger),
  };
}

export async function getAutomationRules(): Promise<AutomationRuleDetail[]> {
  if (!isSupabaseConfigured()) {
    return fallbackAutomationRules;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("automation_rules")
      .select("id,name,trigger,channel,template,enabled,delay_minutes")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) {
      return fallbackAutomationRules;
    }

    return (data as AutomationRuleRow[]).map(mapAutomationRule);
  } catch {
    return fallbackAutomationRules;
  }
}

export async function getAutomationRuleDetail(
  ruleId: string,
): Promise<AutomationRuleDetail | null> {
  if (!isSupabaseConfigured()) {
    return fallbackAutomationRules.find((rule) => rule.id === ruleId) ?? null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("automation_rules")
      .select("id,name,trigger,channel,template,enabled,delay_minutes")
      .eq("id", ruleId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapAutomationRule(data as AutomationRuleRow);
  } catch {
    return null;
  }
}
