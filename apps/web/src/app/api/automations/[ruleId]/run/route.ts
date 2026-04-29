import { NextResponse } from "next/server";
import { automationRunSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import {
  AutomationMutationError,
  runAutomationRule,
} from "@/lib/services/automations";

type RouteContext = {
  params: Promise<{ ruleId: string }>;
};

const idSchema = z.guid();

export async function POST(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const { ruleId } = await params;
  const validRuleId = idSchema.safeParse(ruleId);

  if (!validRuleId.success) {
    return apiError(
      "invalid_automation_rule_id",
      "El identificador de automatizacion no es valido.",
      422,
    );
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = automationRunSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const run = await runAutomationRule(
      context.supabase,
      validRuleId.data,
      parsed.data,
      context.userId,
    );
    return NextResponse.json({ data: run }, { status: 201 });
  } catch (error) {
    if (error instanceof AutomationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "automation_run_failed",
      "No se ha podido ejecutar la automatizacion.",
      400,
    );
  }
}
