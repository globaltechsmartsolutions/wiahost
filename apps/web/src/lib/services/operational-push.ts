import type { NotificationPushInput } from "@wiahost/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendMobilePushNotification } from "@/lib/services/push-notifications";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

type OperationalPushInput = Omit<NotificationPushInput, "userId"> & {
  assignedTo?: string | null;
  includeOperators?: boolean;
  recipientIds?: Array<string | null | undefined>;
  skipUserId?: string | null;
};

type ProfileRecipient = {
  id: string;
};

const OPERATOR_ROLES = ["admin", "operator"] as const;
const MAX_AUTOMATED_PUSH_RECIPIENTS = 12;

function uniqueRecipients(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  ).slice(0, MAX_AUTOMATED_PUSH_RECIPIENTS);
}

async function operatorRecipients(
  supabase: SupabaseServerClient,
  skipUserId?: string | null,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .in("role", [...OPERATOR_ROLES])
    .limit(MAX_AUTOMATED_PUSH_RECIPIENTS);

  if (error) {
    return [];
  }

  return ((data ?? []) as ProfileRecipient[])
    .map((profile) => profile.id)
    .filter((id) => id !== skipUserId);
}

async function resolveRecipients(
  supabase: SupabaseServerClient,
  input: OperationalPushInput,
) {
  const recipients = uniqueRecipients([
    input.assignedTo,
    ...(input.recipientIds ?? []),
  ]).filter((id) => id !== input.skipUserId);

  if (!input.includeOperators) {
    return recipients;
  }

  return uniqueRecipients([
    ...recipients,
    ...(await operatorRecipients(supabase, input.skipUserId)),
  ]);
}

export async function sendOperationalPushSafely(
  supabase: SupabaseServerClient,
  actorUserId: string,
  input: OperationalPushInput,
) {
  try {
    const recipients = await resolveRecipients(supabase, input);

    const results = await Promise.allSettled(
      recipients.map((userId) =>
        sendMobilePushNotification(supabase, actorUserId, {
          body: input.body,
          channelId: input.channelId ?? "operations",
          data: input.data,
          priority: input.priority ?? "default",
          title: input.title,
          type: input.type,
          userId,
        }),
      ),
    );

    return {
      attempted: recipients.length,
      failed: results.filter((result) => result.status === "rejected").length,
      sent: results.filter((result) => result.status === "fulfilled").length,
    };
  } catch {
    // Automated push is a convenience layer. It must never block core writes.
    return {
      attempted: 0,
      failed: 0,
      sent: 0,
    };
  }
}

export function shouldAlertOperations(input: {
  priority?: string | null;
  severity?: string | null;
  status?: string | null;
}) {
  return (
    ["critical", "high"].includes(input.priority ?? "") ||
    ["critical", "high"].includes(input.severity ?? "") ||
    ["blocked", "open", "investigating", "pending_team"].includes(
      input.status ?? "",
    )
  );
}
