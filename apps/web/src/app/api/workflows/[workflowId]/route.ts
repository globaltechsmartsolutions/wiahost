import { NextResponse } from "next/server";
import { guestWorkflowSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getGuestWorkflowDetail } from "@/lib/data/workflows";
import {
  AutomationMutationError,
  deleteAutomationRule,
  updateAutomationRule,
} from "@/lib/services/automations";

type RouteContext = {
  params: Promise<{ workflowId: string }>;
};

const idSchema = z.guid();

async function validWorkflowId(params: RouteContext["params"]) {
  const { workflowId } = await params;
  const validId = idSchema.safeParse(workflowId);

  if (!validId.success) {
    return {
      error: apiError(
        "invalid_workflow_id",
        "El identificador de workflow no es valido.",
        422,
      ),
    };
  }

  return { workflowId: validId.data };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validWorkflowId(params);

  if ("error" in result) {
    return result.error;
  }

  const workflow = await getGuestWorkflowDetail(result.workflowId);

  if (!workflow) {
    return apiError("workflow_not_found", "Workflow no encontrado.", 404);
  }

  return NextResponse.json({ data: workflow });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validWorkflowId(params);

  if ("error" in result) {
    return result.error;
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
    const workflow = await updateAutomationRule(
      context.supabase,
      result.workflowId,
      parsed.data,
    );
    return NextResponse.json({ data: workflow });
  } catch (error) {
    if (error instanceof AutomationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "workflow_update_failed",
      "No se ha podido actualizar el workflow.",
      400,
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validWorkflowId(params);

  if ("error" in result) {
    return result.error;
  }

  try {
    const workflow = await deleteAutomationRule(
      context.supabase,
      result.workflowId,
    );
    return NextResponse.json({ data: workflow });
  } catch (error) {
    if (error instanceof AutomationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "workflow_delete_failed",
      "No se ha podido eliminar el workflow.",
      400,
    );
  }
}
