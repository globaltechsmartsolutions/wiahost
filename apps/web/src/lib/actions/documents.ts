"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { documentSchema } from "@wiahost/shared";
import { z } from "zod";

import {
  createDocument,
  deleteDocument,
  DocumentMutationError,
  updateDocument,
} from "@/lib/services/documents";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const idSchema = z.guid();

function redirectWithError(message: string): never {
  redirect(`/documents?error=${encodeURIComponent(message)}`);
}

async function requireDocumentContext() {
  if (!isSupabaseConfigured()) {
    redirectWithError("Supabase no esta configurado.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(
      `/login?error=${encodeURIComponent("Inicia sesion para gestionar documentos.")}`,
    );
  }

  return { supabase, userId: userData.user.id };
}

function documentInputFromForm(formData: FormData) {
  return {
    incidentId: formData.get("incidentId"),
    mimeType: formData.get("mimeType"),
    propertyId: formData.get("propertyId"),
    reservationId: formData.get("reservationId"),
    storagePath: formData.get("storagePath"),
    title: formData.get("title"),
  };
}

export async function createDocumentAction(formData: FormData) {
  const parsed = documentSchema.safeParse(documentInputFromForm(formData));

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0]?.message ?? "Documento no valido.",
    );
  }

  const { supabase, userId } = await requireDocumentContext();

  try {
    await createDocument(supabase, parsed.data, userId);
  } catch (error) {
    if (error instanceof DocumentMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido crear el documento.");
  }

  revalidatePath("/documents");
  redirect("/documents?created=1");
}

export async function updateDocumentAction(formData: FormData) {
  const documentId = String(formData.get("documentId") ?? "");
  const validDocumentId = idSchema.safeParse(documentId);

  if (!validDocumentId.success) {
    redirectWithError("El identificador de documento no es valido.");
  }

  const parsed = documentSchema.safeParse(documentInputFromForm(formData));

  if (!parsed.success) {
    redirectWithError(
      parsed.error.issues[0]?.message ?? "Documento no valido.",
    );
  }

  const { supabase } = await requireDocumentContext();

  try {
    await updateDocument(supabase, validDocumentId.data, parsed.data);
  } catch (error) {
    if (error instanceof DocumentMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido actualizar el documento.");
  }

  revalidatePath("/documents");
  redirect("/documents?updated=1");
}

export async function deleteDocumentAction(formData: FormData) {
  const documentId = String(formData.get("documentId") ?? "");
  const validDocumentId = idSchema.safeParse(documentId);

  if (!validDocumentId.success) {
    redirectWithError("El identificador de documento no es valido.");
  }

  const { supabase } = await requireDocumentContext();

  try {
    await deleteDocument(supabase, validDocumentId.data);
  } catch (error) {
    if (error instanceof DocumentMutationError) {
      redirectWithError(error.message);
    }

    redirectWithError("No se ha podido eliminar el documento.");
  }

  revalidatePath("/documents");
  redirect("/documents?deleted=1");
}
