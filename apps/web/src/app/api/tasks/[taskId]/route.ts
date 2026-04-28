import { NextResponse } from "next/server";
import { taskSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getTaskDetail } from "@/lib/data/operations";
import { OperationMutationError, updateTask } from "@/lib/services/operations";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

const idSchema = z.guid();

async function validTaskId(params: RouteContext["params"]) {
  const { taskId } = await params;
  const validId = idSchema.safeParse(taskId);

  if (!validId.success) {
    return {
      error: apiError(
        "invalid_task_id",
        "El identificador de tarea no es valido.",
        422,
      ),
    };
  }

  return { taskId: validId.data };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validTaskId(params);

  if ("error" in result) {
    return result.error;
  }

  const task = await getTaskDetail(result.taskId);

  if (!task) {
    return apiError("task_not_found", "Tarea no encontrada.", 404);
  }

  return NextResponse.json({ data: task });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validTaskId(params);

  if ("error" in result) {
    return result.error;
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = taskSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const task = await updateTask(context.supabase, result.taskId, parsed.data);
    return NextResponse.json({ data: task });
  } catch (error) {
    if (error instanceof OperationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "task_update_failed",
      "No se ha podido actualizar la tarea.",
      400,
    );
  }
}
