import { NextResponse } from "next/server";
import { documentSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getDocumentDetail } from "@/lib/data/documents";
import {
  deleteDocument,
  DocumentMutationError,
  updateDocument,
} from "@/lib/services/documents";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

const idSchema = z.guid();

async function validDocumentId(params: RouteContext["params"]) {
  const { documentId } = await params;
  const validId = idSchema.safeParse(documentId);

  if (!validId.success) {
    return {
      error: apiError(
        "invalid_document_id",
        "El identificador de documento no es valido.",
        422,
      ),
    };
  }

  return { documentId: validId.data };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validDocumentId(params);

  if ("error" in result) {
    return result.error;
  }

  const document = await getDocumentDetail(result.documentId);

  if (!document) {
    return apiError("document_not_found", "Documento no encontrado.", 404);
  }

  return NextResponse.json({ data: document });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validDocumentId(params);

  if ("error" in result) {
    return result.error;
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = documentSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const document = await updateDocument(
      context.supabase,
      result.documentId,
      parsed.data,
    );
    return NextResponse.json({ data: document });
  } catch (error) {
    if (error instanceof DocumentMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "document_update_failed",
      "No se ha podido actualizar el documento.",
      400,
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validDocumentId(params);

  if ("error" in result) {
    return result.error;
  }

  try {
    const document = await deleteDocument(context.supabase, result.documentId);
    return NextResponse.json({ data: document });
  } catch (error) {
    if (error instanceof DocumentMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "document_delete_failed",
      "No se ha podido eliminar el documento.",
      400,
    );
  }
}
