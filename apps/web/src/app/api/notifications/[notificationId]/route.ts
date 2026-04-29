import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedApiContext } from "@/lib/api/context";
import { apiError } from "@/lib/api/responses";
import {
  markNotificationRead,
  NotificationMutationError,
} from "@/lib/services/notifications";

type RouteContext = {
  params: Promise<{ notificationId: string }>;
};

const idSchema = z.guid();

export async function PATCH(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const { notificationId } = await params;
  const validNotificationId = idSchema.safeParse(notificationId);

  if (!validNotificationId.success) {
    return apiError(
      "invalid_notification_id",
      "El identificador de notificacion no es valido.",
      422,
    );
  }

  try {
    const notification = await markNotificationRead(
      context.supabase,
      validNotificationId.data,
    );
    return NextResponse.json({ data: notification });
  } catch (error) {
    if (error instanceof NotificationMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "notification_update_failed",
      "No se ha podido marcar la notificacion como leida.",
      400,
    );
  }
}
