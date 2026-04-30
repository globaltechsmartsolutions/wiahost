import { useQuery } from "@tanstack/react-query";

import { demoQueue } from "@/src/lib/demo-data";
import { readOfflineCache, writeOfflineCache } from "@/src/lib/offline-cache";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

type Relation<T> = T | T[] | null | undefined;

export type MobileTaskDetail = {
  cachedAt?: string;
  description: string;
  due: string;
  id: string;
  priority: string;
  property: string;
  propertyId: string | null;
  reservationId: string | null;
  source: "cache" | "demo" | "live";
  status: string;
  statusValue: string;
  title: string;
  type: string;
};

const taskDetailCacheKey = (taskId: string) => `task-detail-v1:${taskId}`;

const statusLabels: Record<string, string> = {
  blocked: "Bloqueada",
  cancelled: "Cancelada",
  done: "Cerrada",
  in_progress: "En curso",
  open: "Abierta",
  scheduled: "Programada",
};

const priorityLabels: Record<string, string> = {
  critical: "Critica",
  high: "Alta",
  low: "Baja",
  medium: "Media",
};

const typeLabels: Record<string, string> = {
  admin: "Admin",
  cleaning: "Limpieza",
  guest_request: "Huesped",
  inspection: "Inspeccion",
  maintenance: "Mantenimiento",
};

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function label(value: string | null | undefined) {
  if (!value) {
    return "Pendiente";
  }

  return (
    statusLabels[value] ?? priorityLabels[value] ?? typeLabels[value] ?? value
  );
}

function dueLabel(value: string | null | undefined) {
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

function fallbackTask(taskId: string): MobileTaskDetail | null {
  const task = demoQueue.find((item) => item.id === taskId);

  if (!task) {
    return null;
  }

  return {
    description:
      "Tarea demo para validar el flujo movil antes de conectar Supabase.",
    due: task.meta,
    id: task.id,
    priority: task.priority,
    property: task.meta,
    propertyId: null,
    reservationId: null,
    source: "demo",
    status: "Abierta",
    statusValue: "open",
    title: task.label,
    type: "Operacion",
  };
}

async function cachedTask(taskId: string) {
  const cached = await readOfflineCache<MobileTaskDetail>(
    taskDetailCacheKey(taskId),
  );

  if (!cached) {
    return null;
  }

  return {
    ...cached.value,
    cachedAt: cached.savedAt,
    source: "cache" as const,
  };
}

async function loadTaskDetail(
  taskId: string,
): Promise<MobileTaskDetail | null> {
  if (!isSupabaseConfigured()) {
    return fallbackTask(taskId);
  }

  try {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        "id,title,type,status,priority,due_at,description,property_id,reservation_id,properties(name)",
      )
      .eq("id", taskId)
      .single();

    if (error || !data) {
      return fallbackTask(taskId);
    }

    const task = data as {
      description: string | null;
      due_at: string | null;
      id: string;
      priority: string | null;
      property_id: string | null;
      properties?: Relation<{ name: string | null }>;
      reservation_id: string | null;
      status: string | null;
      title: string;
      type: string | null;
    };

    const detail = {
      description: task.description ?? "Sin descripcion ampliada.",
      due: dueLabel(task.due_at),
      id: task.id,
      priority: label(task.priority),
      property: one(task.properties)?.name ?? "Propiedad sin asignar",
      propertyId: task.property_id,
      reservationId: task.reservation_id,
      source: "live" as const,
      status: label(task.status),
      statusValue: task.status ?? "open",
      title: task.title,
      type: label(task.type),
    };

    await writeOfflineCache(taskDetailCacheKey(taskId), detail);

    return detail;
  } catch {
    return (await cachedTask(taskId)) ?? fallbackTask(taskId);
  }
}

export function useTaskDetail(taskId: string | undefined) {
  return useQuery({
    enabled: Boolean(taskId),
    queryFn: () => loadTaskDetail(taskId ?? ""),
    queryKey: ["task-detail", taskId],
  });
}
