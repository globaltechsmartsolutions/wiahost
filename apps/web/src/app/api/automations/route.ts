import { NextResponse } from "next/server";
import { automationRuleSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getAutomationRules } from "@/lib/data/automations";
import {
  AutomationMutationError,
  createAutomationRule,
} from "@/lib/services/automations";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const rules = await getAutomationRules();
  return NextResponse.json({ data: rules });
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

  const parsed = automationRuleSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const rule = await createAutomationRule(
      context.supabase,
      parsed.data,
      context.userId,
    );
    return NextResponse.json({ data: rule }, { status: 201 });
  } catch (error) {
    if (error instanceof AutomationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "automation_create_failed",
      "No se ha podido crear la automatizacion.",
      400,
    );
  }
}
