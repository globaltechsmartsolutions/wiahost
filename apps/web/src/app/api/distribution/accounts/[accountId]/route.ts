import { NextResponse } from "next/server";
import { channelAccountSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getChannelAccountDetail } from "@/lib/data/distribution";
import {
  deleteChannelAccount,
  DistributionMutationError,
  updateChannelAccount,
} from "@/lib/services/distribution";

type RouteContext = {
  params: Promise<{ accountId: string }>;
};

const idSchema = z.guid();

async function validAccountId(params: RouteContext["params"]) {
  const { accountId } = await params;
  const validId = idSchema.safeParse(accountId);

  if (!validId.success) {
    return {
      error: apiError(
        "invalid_channel_account_id",
        "El identificador de conector no es valido.",
        422,
      ),
    };
  }

  return { accountId: validId.data };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validAccountId(params);

  if ("error" in result) {
    return result.error;
  }

  const account = await getChannelAccountDetail(result.accountId);

  if (!account) {
    return apiError(
      "channel_account_not_found",
      "Conector de canal no encontrado.",
      404,
    );
  }

  return NextResponse.json({ data: account });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validAccountId(params);

  if ("error" in result) {
    return result.error;
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = channelAccountSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const account = await updateChannelAccount(
      context.supabase,
      result.accountId,
      parsed.data,
    );
    return NextResponse.json({ data: account });
  } catch (error) {
    if (error instanceof DistributionMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "channel_account_update_failed",
      "No se ha podido actualizar el conector de canal.",
      400,
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validAccountId(params);

  if ("error" in result) {
    return result.error;
  }

  try {
    const account = await deleteChannelAccount(
      context.supabase,
      result.accountId,
    );
    return NextResponse.json({ data: account });
  } catch (error) {
    if (error instanceof DistributionMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "channel_account_delete_failed",
      "No se ha podido eliminar el conector de canal.",
      400,
    );
  }
}
