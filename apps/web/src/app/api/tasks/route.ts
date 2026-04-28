import { NextResponse } from "next/server";
import { taskSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getTasks } from "@/lib/data/operations";
import { createTask, OperationMutationError } from "@/lib/services/operations";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const tasks = await getTasks();
  return NextResponse.json({ data: tasks });
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

  const parsed = taskSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const task = await createTask(context.supabase, parsed.data, context.userId);
    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    if (error instanceof OperationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError("task_create_failed", "No se ha podido crear la tarea.", 400);
  }
}
