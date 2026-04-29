import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type NotificationRow = {
  body: string | null;
  created_at: string;
  id: string;
  read_at: string | null;
  title: string;
};

export type NotificationListItem = {
  body: string;
  createdAt: string;
  id: string;
  isUnread: boolean;
  raw: {
    body: string;
    readAt: string;
    title: string;
  };
  status: string;
  title: string;
};

export type NotificationSummary = {
  latest: NotificationListItem[];
  unreadCount: number;
};

const fallbackNotifications: NotificationListItem[] = [
  {
    body: "Sofia Martin ha enviado un mensaje sobre su llegada.",
    createdAt: "Demo",
    id: "demo-notification-1",
    isUnread: true,
    raw: {
      body: "Sofia Martin ha enviado un mensaje sobre su llegada.",
      readAt: "",
      title: "Mensaje pendiente",
    },
    status: "Sin leer",
    title: "Mensaje pendiente",
  },
  {
    body: "Hay una tarea critica antes del proximo check-in.",
    createdAt: "Demo",
    id: "demo-notification-2",
    isUnread: false,
    raw: {
      body: "Hay una tarea critica antes del proximo check-in.",
      readAt: "Demo",
      title: "Tarea revisada",
    },
    status: "Leida",
    title: "Tarea revisada",
  },
];

function shortDate(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function mapNotification(row: NotificationRow): NotificationListItem {
  const isUnread = !row.read_at;

  return {
    body: row.body ?? "Sin detalle adicional.",
    createdAt: shortDate(row.created_at),
    id: row.id,
    isUnread,
    raw: {
      body: row.body ?? "",
      readAt: row.read_at ?? "",
      title: row.title,
    },
    status: isUnread ? "Sin leer" : "Leida",
    title: row.title,
  };
}

export async function getNotifications(): Promise<NotificationListItem[]> {
  if (!isSupabaseConfigured()) {
    return fallbackNotifications;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("id,title,body,read_at,created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) {
      return fallbackNotifications;
    }

    return (data as NotificationRow[]).map(mapNotification);
  } catch {
    return fallbackNotifications;
  }
}

export async function getNotificationSummary(): Promise<NotificationSummary> {
  const notifications = await getNotifications();

  return {
    latest: notifications.slice(0, 3),
    unreadCount: notifications.filter((notification) => notification.isUnread)
      .length,
  };
}
