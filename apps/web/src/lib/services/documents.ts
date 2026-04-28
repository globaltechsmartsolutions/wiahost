import type { DocumentInput } from "@wiahost/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export class DocumentMutationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mutationError(code: string, message: string): never {
  throw new DocumentMutationError(code, message);
}

function optionalValue(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

function toDocumentPayload(input: DocumentInput) {
  return {
    incident_id: optionalValue(input.incidentId),
    mime_type: optionalValue(input.mimeType),
    property_id: optionalValue(input.propertyId),
    reservation_id: optionalValue(input.reservationId),
    storage_path: input.storagePath.trim(),
    title: input.title.trim(),
  };
}

export async function createDocument(
  supabase: SupabaseServerClient,
  input: DocumentInput,
  userId: string,
) {
  const { data, error } = await supabase
    .from("documents")
    .insert({
      ...toDocumentPayload(input),
      owner_profile_id: userId,
    })
    .select("id,title,storage_path")
    .single();

  if (error || !data) {
    mutationError(
      "document_create_failed",
      "No se ha podido crear el documento.",
    );
  }

  return data;
}

export async function updateDocument(
  supabase: SupabaseServerClient,
  documentId: string,
  input: DocumentInput,
) {
  const { data, error } = await supabase
    .from("documents")
    .update(toDocumentPayload(input))
    .eq("id", documentId)
    .select("id,title,storage_path")
    .single();

  if (error || !data) {
    mutationError(
      "document_update_failed",
      "No se ha podido actualizar el documento.",
    );
  }

  return data;
}

export async function deleteDocument(
  supabase: SupabaseServerClient,
  documentId: string,
) {
  const { data, error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .select("id")
    .single();

  if (error || !data) {
    mutationError(
      "document_delete_failed",
      "No se ha podido eliminar el documento.",
    );
  }

  return data;
}
