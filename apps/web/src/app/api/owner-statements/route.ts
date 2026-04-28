import { NextResponse } from "next/server";
import { ownerStatementSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getOwnerStatements } from "@/lib/data/owner-statements";
import {
  createOwnerStatement,
  OwnerStatementMutationError,
} from "@/lib/services/owner-statements";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const statements = await getOwnerStatements();
  return NextResponse.json({ data: statements });
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

  const parsed = ownerStatementSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const statement = await createOwnerStatement(context.supabase, parsed.data);
    return NextResponse.json({ data: statement }, { status: 201 });
  } catch (error) {
    if (error instanceof OwnerStatementMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "owner_statement_create_failed",
      "No se ha podido crear la liquidacion.",
      400,
    );
  }
}
