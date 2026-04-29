import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedApiContext } from "@/lib/api/context";
import { apiError } from "@/lib/api/responses";
import {
  createDocumentDownloadUrl,
  DocumentMutationError,
} from "@/lib/services/documents";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

const idSchema = z.guid();

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const { documentId } = await params;
  const validDocumentId = idSchema.safeParse(documentId);

  if (!validDocumentId.success) {
    return apiError(
      "invalid_document_id",
      "El identificador de documento no es valido.",
      422,
    );
  }

  try {
    const download = await createDocumentDownloadUrl(
      context.supabase,
      validDocumentId.data,
    );

    return NextResponse.redirect(download.signedUrl);
  } catch (error) {
    if (error instanceof DocumentMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "document_signed_url_failed",
      "No se ha podido crear el enlace seguro del documento.",
      400,
    );
  }
}
