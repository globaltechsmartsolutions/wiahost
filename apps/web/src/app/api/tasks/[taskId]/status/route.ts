import { NextResponse } from "next/server";
import { updateTaskStatusSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { OperationMutationError, updateTaskStatus } from "@/lib/services/operations";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

const idSchema = z.guid();

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const { taskId } = await params;
  const validId = idSchema.safeParse(taskId);

  if (!validId.success) {
    return apiError("invalid_task_id", "El identificador de tarea no es valido.", 422);
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = updateTaskStatusSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const task = await updateTaskStatus(
      context.supabase,
      validId.data,
      parsed.data.status,
      context.userId,
    );
    return NextResponse.json({ data: task });
  } catch (error) {
    if (error instanceof OperationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError("task_update_failed", "No se ha podido actualizar la tarea.", 400);
  }
}
