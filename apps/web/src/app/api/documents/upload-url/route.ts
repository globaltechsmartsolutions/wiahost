import { NextResponse } from "next/server";
import { documentUploadUrlSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import {
  createDocumentSignedUploadUrl,
  DocumentMutationError,
} from "@/lib/services/documents";

export async function POST(request: Request) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = documentUploadUrlSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const upload = await createDocumentSignedUploadUrl(
      context.supabase,
      parsed.data,
    );

    return NextResponse.json({ data: upload }, { status: 201 });
  } catch (error) {
    if (error instanceof DocumentMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "document_upload_url_failed",
      "No se ha podido crear el enlace seguro de subida.",
      400,
    );
  }
}
