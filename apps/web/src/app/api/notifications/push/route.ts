import { NextResponse } from "next/server";
import { notificationPushSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import {
  PushNotificationMutationError,
  sendMobilePushNotification,
} from "@/lib/services/push-notifications";

export async function POST(request: Request) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = notificationPushSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const result = await sendMobilePushNotification(
      context.supabase,
      context.userId,
      parsed.data,
    );

    return NextResponse.json({ data: result }, { status: 202 });
  } catch (error) {
    if (error instanceof PushNotificationMutationError) {
      return apiError(error.code, error.message, error.status);
    }

    return apiError(
      "push_notification_failed",
      "No se ha podido enviar la push notification.",
      500,
    );
  }
}
