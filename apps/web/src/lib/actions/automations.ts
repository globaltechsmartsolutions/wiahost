"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { automationRuleSchema } from "@wiahost/shared";
import { z } from "zod";

import {
  AutomationMutationError,
  createAutomationRule,
  deleteAutomationRule,
  updateAutomationRule,
} from "@/lib/services/automations";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.guid();

function redirectWithError(message: string): never {
  redirect(`/automations?error=${encodeURIComponent(message)}`);
}

async function requireAutomationClient() {
  if (!isSupabaseConfigured()) {
    redirectWithError("Supabase no esta configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para gestionar automatizaciones.")}`,
    );
  }

  return { supabase, userId: userData.user.id };
}

function automationInputFromForm(formData: FormData) {
  return {
    channel: formData.get("channel"),
    delayMinutes: formData.get("delayMinutes"),
    enabled: formData.get("enabled") === "on",
    name: formData.get("name"),
    template: formData.get("template"),
    trigger: formData.get("trigger"),
  };
}

export async function createAutomationRuleAction(formData: FormData) {
  const parsed = automationRuleSchema.safeParse(
    automationInputFromForm(formData),
  );

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0]?.message ?? "Automatizacion no valida.",
    );
  }

  const { supabase, userId } = await requireAutomationClient();

  try {
    await createAutomationRule(supabase, parsed.data, userId);
  } catch (error) {
    if (error instanceof AutomationMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido crear la automatizacion.");
  }

  revalidatePath("/automations");
  revalidatePath("/dashboard");
  redirect("/automations?created=1");
}

export async function updateAutomationRuleAction(formData: FormData) {
  const ruleId = String(formData.get("ruleId") ?? "");
  const validRuleId = idSchema.safeParse(ruleId);

  if (!validRuleId.success) {
    redirectWithError("El identificador de automatizacion no es valido.");
  }

  const parsed = automationRuleSchema.safeParse(
    automationInputFromForm(formData),
  );

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0]?.message ?? "Automatizacion no valida.",
    );
  }

  const { supabase } = await requireAutomationClient();

  try {
    await updateAutomationRule(supabase, validRuleId.data, parsed.data);
  } catch (error) {
    if (error instanceof AutomationMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido actualizar la automatizacion.");
  }

  revalidatePath("/automations");
  revalidatePath("/dashboard");
  redirect("/automations?updated=1");
}

export async function deleteAutomationRuleAction(formData: FormData) {
  const ruleId = String(formData.get("ruleId") ?? "");
  const validRuleId = idSchema.safeParse(ruleId);

  if (!validRuleId.success) {
    redirectWithError("El identificador de automatizacion no es valido.");
  }

  const { supabase } = await requireAutomationClient();

  try {
    await deleteAutomationRule(supabase, validRuleId.data);
  } catch (error) {
    if (error instanceof AutomationMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido eliminar la automatizacion.");
  }

  revalidatePath("/automations");
  revalidatePath("/dashboard");
  redirect("/automations?deleted=1");
}
