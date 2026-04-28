"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ownerStatementSchema } from "@wiahost/shared";
import { z } from "zod";

import {
  createOwnerStatement,
  deleteOwnerStatement,
  OwnerStatementMutationError,
  updateOwnerStatement,
} from "@/lib/services/owner-statements";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.guid();

function redirectWithError(message: string): never {
  redirect(`/statements?error=${encodeURIComponent(message)}`);
}

async function requireStatementClient() {
  if (!isSupabaseConfigured()) {
    redirectWithError("Supabase no esta configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para gestionar liquidaciones.")}`,
    );
  }

  return supabase;
}

function statementInputFromForm(formData: FormData) {
  return {
    cleaningCosts: formData.get("cleaningCosts"),
    grossRevenue: formData.get("grossRevenue"),
    maintenanceCosts: formData.get("maintenanceCosts"),
    netPayout: formData.get("netPayout"),
    ownerAccountId: formData.get("ownerAccountId"),
    periodEnd: formData.get("periodEnd"),
    periodStart: formData.get("periodStart"),
    platformFees: formData.get("platformFees"),
    propertyId: formData.get("propertyId"),
    status: formData.get("status"),
  };
}

export async function createOwnerStatementAction(formData: FormData) {
  const parsed = ownerStatementSchema.safeParse(
    statementInputFromForm(formData),
  );

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0]?.message ?? "Liquidacion no valida.",
    );
  }

  const supabase = await requireStatementClient();

  try {
    await createOwnerStatement(supabase, parsed.data);
  } catch (error) {
    if (error instanceof OwnerStatementMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido crear la liquidacion.");
  }

  revalidatePath("/statements");
  revalidatePath("/owners");
  redirect("/statements?created=1");
}

export async function updateOwnerStatementAction(formData: FormData) {
  const statementId = String(formData.get("statementId") ?? "");
  const validStatementId = idSchema.safeParse(statementId);

  if (!validStatementId.success) {
    redirectWithError("El identificador de liquidacion no es valido.");
  }

  const parsed = ownerStatementSchema.safeParse(
    statementInputFromForm(formData),
  );

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0]?.message ?? "Liquidacion no valida.",
    );
  }

  const supabase = await requireStatementClient();

  try {
    await updateOwnerStatement(supabase, validStatementId.data, parsed.data);
  } catch (error) {
    if (error instanceof OwnerStatementMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido actualizar la liquidacion.");
  }

  revalidatePath("/statements");
  revalidatePath("/owners");
  redirect("/statements?updated=1");
}

export async function deleteOwnerStatementAction(formData: FormData) {
  const statementId = String(formData.get("statementId") ?? "");
  const validStatementId = idSchema.safeParse(statementId);

  if (!validStatementId.success) {
    redirectWithError("El identificador de liquidacion no es valido.");
  }

  const supabase = await requireStatementClient();

  try {
    await deleteOwnerStatement(supabase, validStatementId.data);
  } catch (error) {
    if (error instanceof OwnerStatementMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido eliminar la liquidacion.");
  }

  revalidatePath("/statements");
  revalidatePath("/owners");
  redirect("/statements?deleted=1");
}
