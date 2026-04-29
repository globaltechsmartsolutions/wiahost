import { NextResponse } from "next/server";
import { notificationSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getNotifications } from "@/lib/data/notifications";
import {
  createNotification,
  NotificationMutationError,
} from "@/lib/services/notifications";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const notifications = await getNotifications();
  return NextResponse.json({ data: notifications });
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

  const parsed = notificationSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const notification = await createNotification(
      context.supabase,
      context.userId,
      parsed.data,
    );
    return NextResponse.json({ data: notification }, { status: 201 });
  } catch (error) {
    if (error instanceof NotificationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "notification_create_failed",
      "No se ha podido crear la notificacion.",
      400,
    );
  }
}
