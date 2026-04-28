import type { AutomationRuleInput } from "@wiahost/shared";
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
