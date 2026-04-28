import { NextResponse } from "next/server";
import { documentSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getDocuments } from "@/lib/data/documents";
import {
  createDocument,
  DocumentMutationError,
} from "@/lib/services/documents";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const documents = await getDocuments();
  return NextResponse.json({ data: documents });
}

export async function POST(request: Request) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
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
    const document = await createDocument(
      context.supabase,
      parsed.data,
      context.userId,
    );
    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    if (error instanceof DocumentMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "document_create_failed",
      "No se ha podido crear el documento.",
      400,
    );
  }
}
