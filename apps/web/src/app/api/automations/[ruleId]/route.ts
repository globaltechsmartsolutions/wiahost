import { NextResponse } from "next/server";
import { automationRuleSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getAutomationRuleDetail } from "@/lib/data/automations";
import {
  AutomationMutationError,
  deleteAutomationRule,
  updateAutomationRule,
} from "@/lib/services/automations";

type RouteContext = {
  params: Promise<{ ruleId: string }>;
};

const idSchema = z.guid();

async function validRuleId(params: RouteContext["params"]) {
  const { ruleId } = await params;
  const validId = idSchema.safeParse(ruleId);

  if (!validId.success) {
    return {
      error: apiError(
        "invalid_automation_rule_id",
        "El identificador de automatizacion no es valido.",
        422,
      ),
    };
  }

  return { ruleId: validId.data };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validRuleId(params);

  if ("error" in result) {
    return result.error;
  }

  const rule = await getAutomationRuleDetail(result.ruleId);

  if (!rule) {
    return apiError(
      "automation_rule_not_found",
      "Automatizacion no encontrada.",
      404,
    );
  }

  return NextResponse.json({ data: rule });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validRuleId(params);

  if ("error" in result) {
    return result.error;
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
    const rule = await updateAutomationRule(
      context.supabase,
      result.ruleId,
      parsed.data,
    );
    return NextResponse.json({ data: rule });
  } catch (error) {
    if (error instanceof AutomationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "automation_update_failed",
      "No se ha podido actualizar la automatizacion.",
      400,
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validRuleId(params);

  if ("error" in result) {
    return result.error;
  }

  try {
    const rule = await deleteAutomationRule(context.supabase, result.ruleId);
    return NextResponse.json({ data: rule });
  } catch (error) {
    if (error instanceof AutomationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "automation_delete_failed",
      "No se ha podido eliminar la automatizacion.",
      400,
    );
  }
}
