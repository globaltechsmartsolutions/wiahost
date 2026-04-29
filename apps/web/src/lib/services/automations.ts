import {
  renderMessageTemplate,
  type AutomationRuleInput,
  type AutomationRunInput,
  type TemplateContext,
} from "@wiahost/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export class AutomationMutationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mutationError(code: string, message: string): never {
  throw new AutomationMutationError(code, message);
}

function shortDate(value: string | null | undefined) {
  if (!value) {
    return "pendiente";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

async function recordAutomationEvent(
  supabase: SupabaseServerClient,
  input: {
    metadata: Record<string, unknown>;
    reservationId?: string;
    ruleId: string;
    userId: string;
  },
) {
  try {
    await supabase.from("operational_events").insert({
      actor_profile_id: input.userId,
      actor_type: "user",
      entity_id: input.ruleId,
      entity_type: "automation_rule",
      event_name: "automation.manual_run",
      metadata: input.metadata,
      reservation_id: input.reservationId ?? null,
      source: "web",
    });
  } catch {
    // Audit events must never block the operation they describe.
  }
}

export async function createAutomationRule(
  supabase: SupabaseServerClient,
  input: AutomationRuleInput,
  userId: string,
) {
  const { data, error } = await supabase
    .from("automation_rules")
    .insert({
      channel: input.channel,
      created_by: userId,
      delay_minutes: input.delayMinutes,
      enabled: input.enabled,
      name: input.name,
      template: input.template,
      trigger: input.trigger,
    })
    .select("id,name,enabled")
    .single();

  if (error || !data) {
    mutationError(
      "automation_create_failed",
      "No se ha podido crear la automatizacion.",
    );
  }

  return data;
}

export async function updateAutomationRule(
  supabase: SupabaseServerClient,
  ruleId: string,
  input: AutomationRuleInput,
) {
  const { data, error } = await supabase
    .from("automation_rules")
    .update({
      channel: input.channel,
      delay_minutes: input.delayMinutes,
      enabled: input.enabled,
      name: input.name,
      template: input.template,
      trigger: input.trigger,
    })
    .eq("id", ruleId)
    .select("id,name,enabled")
    .single();

  if (error || !data) {
    mutationError(
      "automation_update_failed",
      "No se ha podido actualizar la automatizacion.",
    );
  }

  return data;
}

export async function deleteAutomationRule(
  supabase: SupabaseServerClient,
  ruleId: string,
) {
  const { data, error } = await supabase
    .from("automation_rules")
    .delete()
    .eq("id", ruleId)
    .select("id")
    .single();

  if (error || !data) {
    mutationError(
      "automation_delete_failed",
      "No se ha podido eliminar la automatizacion.",
    );
  }

  return data;
}

export async function runAutomationRule(
  supabase: SupabaseServerClient,
  ruleId: string,
  input: AutomationRunInput,
  userId: string,
) {
  const { data: rule, error: ruleError } = await supabase
    .from("automation_rules")
    .select("id,name,trigger,channel,template,enabled,delay_minutes")
    .eq("id", ruleId)
    .single();

  if (ruleError || !rule) {
    mutationError(
      "automation_rule_not_found",
      "No se ha encontrado la automatizacion.",
    );
  }

  let reservation:
    | {
        check_in: string | null;
        check_out: string | null;
        guest_id: string | null;
        guests?:
          | { email?: string | null; full_name: string | null; phone?: string | null }
          | Array<{ email?: string | null; full_name: string | null; phone?: string | null }>
          | null;
        properties?:
          | {
              checkin_instructions?: string | null;
              house_rules?: string | null;
              id: string | null;
              name: string | null;
            }
          | Array<{
              checkin_instructions?: string | null;
              house_rules?: string | null;
              id: string | null;
              name: string | null;
            }>
          | null;
      }
    | null = null;

  if (input.reservationId) {
    const { data, error } = await supabase
      .from("reservations")
      .select(
        "id,guest_id,check_in,check_out,guests(full_name,email,phone),properties(id,name,house_rules,checkin_instructions)",
      )
      .eq("id", input.reservationId)
      .single();

    if (error || !data) {
      mutationError(
        "automation_reservation_not_found",
        "No se ha encontrado la reserva para ejecutar la automatizacion.",
      );
    }

    reservation = data;
  }

  const guest = getRelation(reservation?.guests);
  const property = getRelation(reservation?.properties);
  const templateContext: TemplateContext = {
    access_code: "pendiente de asignar",
    checkin_date: shortDate(reservation?.check_in),
    checkout_date: shortDate(reservation?.check_out),
    guest_name: guest?.full_name ?? "huesped",
    house_rules: property?.house_rules ?? "normas pendientes de revisar",
    property_name: property?.name ?? "propiedad",
    support_phone: guest?.phone ?? "+34 600 000 000",
  };
  const rendered = renderMessageTemplate(rule.template, templateContext, {
    fallback: "[dato pendiente]",
  });
  const executedAt = new Date().toISOString();
  const { data: run, error: runError } = await supabase
    .from("automation_runs")
    .insert({
      error_message: rendered.missingVariables.length
        ? `Variables pendientes: ${rendered.missingVariables.join(", ")}`
        : null,
      executed_at: executedAt,
      guest_id: reservation?.guest_id ?? null,
      reservation_id: input.reservationId ?? null,
      rule_id: ruleId,
      status: rendered.missingVariables.length ? "pending" : "synced",
    })
    .select("id,status,executed_at")
    .single();

  if (runError || !run) {
    mutationError(
      "automation_run_failed",
      "No se ha podido registrar la ejecucion de la automatizacion.",
    );
  }

  await recordAutomationEvent(supabase, {
    metadata: {
      channel: rule.channel,
      delayMinutes: rule.delay_minutes,
      enabled: rule.enabled,
      missingVariables: rendered.missingVariables,
      renderedMessage: rendered.rendered,
      ruleName: rule.name,
      runId: run.id,
      trigger: rule.trigger,
      usedVariables: rendered.usedVariables,
    },
    reservationId: input.reservationId,
    ruleId,
    userId,
  });

  return {
    ...run,
    renderedMessage: rendered.rendered,
  };
}
