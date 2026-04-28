import { NextResponse } from "next/server";
import { ownerStatementSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getOwnerStatementDetail } from "@/lib/data/owner-statements";
import {
  deleteOwnerStatement,
  OwnerStatementMutationError,
  updateOwnerStatement,
} from "@/lib/services/owner-statements";

type RouteContext = {
  params: Promise<{ statementId: string }>;
};

const idSchema = z.guid();

async function validStatementId(params: RouteContext["params"]) {
  const { statementId } = await params;
  const validId = idSchema.safeParse(statementId);

  if (!validId.success) {
    return {
      error: apiError(
        "invalid_owner_statement_id",
        "El identificador de liquidacion no es valido.",
        422,
      ),
    };
  }

  return { statementId: validId.data };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validStatementId(params);

  if ("error" in result) {
    return result.error;
  }

  const statement = await getOwnerStatementDetail(result.statementId);

  if (!statement) {
    return apiError(
      "owner_statement_not_found",
      "Liquidacion no encontrada.",
      404,
    );
  }

  return NextResponse.json({ data: statement });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validStatementId(params);

  if ("error" in result) {
    return result.error;
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
    const statement = await updateOwnerStatement(
      context.supabase,
      result.statementId,
      parsed.data,
    );
    return NextResponse.json({ data: statement });
  } catch (error) {
    if (error instanceof OwnerStatementMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "owner_statement_update_failed",
      "No se ha podido actualizar la liquidacion.",
      400,
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validStatementId(params);

  if ("error" in result) {
    return result.error;
  }

  try {
    const statement = await deleteOwnerStatement(
      context.supabase,
      result.statementId,
    );
    return NextResponse.json({ data: statement });
  } catch (error) {
    if (error instanceof OwnerStatementMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "owner_statement_delete_failed",
      "No se ha podido eliminar la liquidacion.",
      400,
    );
  }
}
