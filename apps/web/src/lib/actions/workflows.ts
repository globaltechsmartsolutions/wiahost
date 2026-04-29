"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guestWorkflowSchema } from "@wiahost/shared";
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
  redirect(`/workflows?error=${encodeURIComponent(message)}`);
}

async function requireWorkflowClient() {
  if (!isSupabaseConfigured()) {
    redirectWithError("Supabase no esta configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para gestionar workflows.")}`,
    );
  }

  return { supabase, userId: userData.user.id };
}

function workflowInputFromForm(formData: FormData) {
  return {
    channel: formData.get("channel"),
    delayMinutes: formData.get("delayMinutes"),
    enabled: formData.get("enabled") === "on",
    name: formData.get("name"),
    template: formData.get("template"),
    trigger: formData.get("trigger"),
  };
}

export async function createWorkflowAction(formData: FormData) {
  const parsed = guestWorkflowSchema.safeParse(workflowInputFromForm(formData));

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Workflow no valido.");
  }

  const { supabase, userId } = await requireWorkflowClient();

  try {
    await createAutomationRule(supabase, parsed.data, userId);
  } catch (error) {
    if (error instanceof AutomationMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido crear el workflow.");
  }

  revalidatePath("/workflows");
  revalidatePath("/automations");
  revalidatePath("/dashboard");
  redirect("/workflows?created=1");
}

export async function updateWorkflowAction(formData: FormData) {
  const workflowId = String(formData.get("workflowId") ?? "");
  const validWorkflowId = idSchema.safeParse(workflowId);

  if (!validWorkflowId.success) {
    redirectWithError("El identificador de workflow no es valido.");
  }

  const parsed = guestWorkflowSchema.safeParse(workflowInputFromForm(formData));

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Workflow no valido.");
  }

  const { supabase } = await requireWorkflowClient();

  try {
    await updateAutomationRule(supabase, validWorkflowId.data, parsed.data);
  } catch (error) {
    if (error instanceof AutomationMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido actualizar el workflow.");
  }

  revalidatePath("/workflows");
  revalidatePath("/automations");
  revalidatePath("/dashboard");
  redirect("/workflows?updated=1");
}

export async function deleteWorkflowAction(formData: FormData) {
  const workflowId = String(formData.get("workflowId") ?? "");
  const validWorkflowId = idSchema.safeParse(workflowId);

  if (!validWorkflowId.success) {
    redirectWithError("El identificador de workflow no es valido.");
  }

  const { supabase } = await requireWorkflowClient();

  try {
    await deleteAutomationRule(supabase, validWorkflowId.data);
  } catch (error) {
    if (error instanceof AutomationMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido eliminar el workflow.");
  }

  revalidatePath("/workflows");
  revalidatePath("/automations");
  revalidatePath("/dashboard");
  redirect("/workflows?deleted=1");
}
