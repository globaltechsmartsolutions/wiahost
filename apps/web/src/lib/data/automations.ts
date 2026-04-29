import {
  extractTemplateVariables,
  renderMessageTemplate,
  templatePreviewContext,
} from "@wiahost/shared";

import {
  automationRules as demoAutomationRules,
  reservations as demoReservations,
} from "@/lib/demo-data";
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

type AutomationRunRow = {
  automation_rules?: Relation<{
    channel: string | null;
    name: string | null;
    trigger: string | null;
  }>;
  created_at: string;
  error_message: string | null;
  executed_at: string | null;
  id: string;
  reservations?: Relation<{
    check_in: string | null;
    check_out: string | null;
    guests?: Relation<{ full_name: string | null }>;
    properties?: Relation<{ name: string | null }>;
  }>;
  status: string;
};

type ReservationOptionRow = {
  check_in: string | null;
  check_out: string | null;
  guests?: Relation<{ full_name: string | null }>;
  id: string;
  properties?: Relation<{ name: string | null }>;
};

type Relation<T> = T | T[] | null | undefined;

export type AutomationRuleDetail = AutomationRuleItem & {
  channel: string;
  id: string;
  missingVariables: string[];
  raw: {
    channel: string;
    delayMinutes: number;
    enabled: boolean;
    name: string;
    template: string;
    trigger: string;
  };
  template: string;
  templatePreview: string;
  variables: string[];
};

export type AutomationRunListItem = {
  channel: string;
  context: string;
  errorMessage?: string;
  executedAt: string;
  id: string;
  ruleName: string;
  status: string;
  trigger: string;
};

export type AutomationRunOption = {
  helper?: string;
  id: string;
  label: string;
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

const statusLabels: Record<string, string> = {
  failed: "Fallida",
  ignored: "Ignorada",
  pending: "Pendiente",
  synced: "Sincronizada",
};

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function getTemplateMetadata(template: string) {
  const preview = renderMessageTemplate(template, templatePreviewContext);

  return {
    missingVariables: preview.missingVariables,
    templatePreview: preview.rendered,
    variables: extractTemplateVariables(template).map(
      (variable) => `{{${variable}}}`,
    ),
  };
}

const fallbackAutomationRules: AutomationRuleDetail[] = demoAutomationRules.map(
  (rule, index) => {
    const template = `Hola {{guest_name}}, plantilla demo para ${rule.name} en {{property_name}}.`;

    return {
      ...rule,
      ...getTemplateMetadata(template),
      channel: index === 1 ? "Inbox" : "Email",
      id: `demo-automation-${index + 1}`,
      raw: {
        channel: index === 1 ? "inbox" : "email",
        delayMinutes: index === 2 ? 30 : 0,
        enabled: rule.status === "Activa",
        name: rule.name,
        template,
        trigger:
          index === 0
            ? "checkin_24h"
            : index === 1
              ? "checkin_1h"
              : "checkout_time",
      },
      template,
    };
  },
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

function shortDate(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function dateRange(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
) {
  if (!checkIn || !checkOut) {
    return "Sin fechas";
  }

  return `${shortDate(checkIn)} - ${shortDate(checkOut)}`;
}

function mapAutomationRule(row: AutomationRuleRow): AutomationRuleDetail {
  const templateMetadata = getTemplateMetadata(row.template);

  return {
    ...templateMetadata,
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

function mapAutomationRun(row: AutomationRunRow): AutomationRunListItem {
  const rule = one(row.automation_rules);
  const reservation = one(row.reservations);
  const guest = one(reservation?.guests);
  const property = one(reservation?.properties);

  return {
    channel: labelFromOptions(channelOptions, rule?.channel ?? "inbox"),
    context: reservation
      ? `${guest?.full_name ?? "Huesped"} - ${property?.name ?? "Propiedad"}`
      : "Prueba sin reserva vinculada",
    errorMessage: row.error_message ?? undefined,
    executedAt: row.executed_at ? shortDate(row.executed_at) : "Pendiente",
    id: row.id,
    ruleName: rule?.name ?? "Regla eliminada",
    status: statusLabels[row.status] ?? row.status,
    trigger: labelFromOptions(triggerOptions, rule?.trigger ?? "message_unanswered"),
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

export async function getAutomationRuns(): Promise<AutomationRunListItem[]> {
  if (!isSupabaseConfigured()) {
    return [
      {
        channel: "Email",
        context: `${demoReservations[0]?.guest ?? "Sofia Martin"} - ${demoReservations[0]?.property ?? "Atico Gran Via Sky"}`,
        executedAt: "Demo",
        id: "demo-automation-run-1",
        ruleName: fallbackAutomationRules[0]?.name ?? "Instrucciones 24h",
        status: "Sincronizada",
        trigger: "Check-in 24h antes",
      },
    ];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("automation_runs")
      .select(
        "id,status,error_message,executed_at,created_at,automation_rules(name,trigger,channel),reservations(check_in,check_out,guests(full_name),properties(name))",
      )
      .order("created_at", { ascending: false })
      .limit(8);

    if (error || !data) {
      return [];
    }

    return (data as AutomationRunRow[]).map(mapAutomationRun);
  } catch {
    return [];
  }
}

export async function getAutomationRunOptions(): Promise<AutomationRunOption[]> {
  const fallbackOptions = demoReservations.map((reservation) => ({
    helper: reservation.dates,
    id: reservation.id,
    label: `${reservation.guest} - ${reservation.property}`,
  }));

  if (!isSupabaseConfigured()) {
    return fallbackOptions;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reservations")
      .select("id,check_in,check_out,guests(full_name),properties(name)")
      .order("check_in", { ascending: false })
      .limit(80);

    if (error || !data) {
      return fallbackOptions;
    }

    return (data as ReservationOptionRow[]).map((reservation) => ({
      helper: dateRange(reservation.check_in, reservation.check_out),
      id: reservation.id,
      label: `${one(reservation.guests)?.full_name ?? "Huesped"} - ${one(reservation.properties)?.name ?? "Propiedad"}`,
    }));
  } catch {
    return fallbackOptions;
  }
}
