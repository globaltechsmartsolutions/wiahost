import { NextResponse } from "next/server";
import { channelAccountSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getChannelAccounts } from "@/lib/data/distribution";
import {
  createChannelAccount,
  DistributionMutationError,
} from "@/lib/services/distribution";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const accounts = await getChannelAccounts();
  return NextResponse.json({ data: accounts });
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

  const parsed = channelAccountSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const account = await createChannelAccount(context.supabase, parsed.data);
    return NextResponse.json({ data: account }, { status: 201 });
  } catch (error) {
    if (error instanceof DistributionMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "channel_account_create_failed",
      "No se ha podido crear el conector de canal.",
      400,
    );
  }
}
