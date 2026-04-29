import type { DocumentInput, DocumentUploadUrlInput } from "@wiahost/shared";
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

const allowedDocumentBuckets = [
  "incident-attachments",
  "property-media",
  "reservation-documents",
] as const;

function parseDocumentStoragePath(storagePath: string) {
  const cleanPath = storagePath.trim().replace(/^\/+/, "");
  const [maybeBucket, ...pathParts] = cleanPath.split("/");

  if (!cleanPath || cleanPath.includes("..")) {
    mutationError(
      "invalid_storage_path",
      "La ruta del documento no es segura.",
    );
  }

  if (
    allowedDocumentBuckets.includes(
      maybeBucket as (typeof allowedDocumentBuckets)[number],
    ) &&
    pathParts.length > 0
  ) {
    return {
      bucket: maybeBucket,
      path: pathParts.join("/"),
    };
  }

  return {
    bucket: "reservation-documents",
    path: cleanPath,
  };
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

export async function createDocumentDownloadUrl(
  supabase: SupabaseServerClient,
  documentId: string,
  expiresInSeconds = 300,
) {
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id,title,storage_path")
    .eq("id", documentId)
    .single();

  if (documentError || !document) {
    mutationError("document_not_found", "Documento no encontrado.");
  }

  const storage = parseDocumentStoragePath(document.storage_path);
  const { data, error } = await supabase.storage
    .from(storage.bucket)
    .createSignedUrl(storage.path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    mutationError(
      "document_signed_url_failed",
      "No se ha podido crear el enlace seguro del documento.",
    );
  }

  return {
    bucket: storage.bucket,
    document,
    expiresInSeconds,
    path: storage.path,
    signedUrl: data.signedUrl,
  };
}

export async function createDocumentSignedUploadUrl(
  supabase: SupabaseServerClient,
  input: DocumentUploadUrlInput,
) {
  const storage = parseDocumentStoragePath(input.storagePath);
  const { data, error } = await supabase.storage
    .from(storage.bucket)
    .createSignedUploadUrl(storage.path, { upsert: input.upsert });
  const uploadData = data as {
    path?: string;
    signedUrl?: string;
    token?: string;
  } | null;

  if (error || !uploadData?.signedUrl || !uploadData.token) {
    mutationError(
      "document_upload_url_failed",
      "No se ha podido crear el enlace seguro de subida.",
    );
  }

  return {
    bucket: storage.bucket,
    path: uploadData.path ?? storage.path,
    signedUrl: uploadData.signedUrl,
    token: uploadData.token,
    upsert: input.upsert,
  };
}
