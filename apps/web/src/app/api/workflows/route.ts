import { NextResponse } from "next/server";
import { guestWorkflowSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getGuestWorkflows } from "@/lib/data/workflows";
import {
  AutomationMutationError,
  createAutomationRule,
} from "@/lib/services/automations";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const workflows = await getGuestWorkflows();
  return NextResponse.json({ data: workflows });
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

  const parsed = guestWorkflowSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const workflow = await createAutomationRule(
      context.supabase,
      parsed.data,
      context.userId,
    );
    return NextResponse.json({ data: workflow }, { status: 201 });
  } catch (error) {
    if (error instanceof AutomationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "workflow_create_failed",
      "No se ha podido crear el workflow.",
      400,
    );
  }
}
