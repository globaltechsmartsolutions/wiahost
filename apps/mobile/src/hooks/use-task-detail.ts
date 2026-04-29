import { useQuery } from "@tanstack/react-query";

import { demoQueue } from "@/src/lib/demo-data";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

type Relation<T> = T | T[] | null | undefined;

export type MobileTaskDetail = {
  description: string;
  due: string;
  id: string;
  priority: string;
  property: string;
  status: string;
  statusValue: string;
  title: string;
  type: string;
};

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

  return statusLabels[value] ?? priorityLabels[value] ?? typeLabels[value] ?? value;
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
    description: "Tarea demo para validar el flujo movil antes de conectar Supabase.",
    due: task.meta,
    id: task.id,
    priority: task.priority,
    property: task.meta,
    status: "Abierta",
    statusValue: "open",
    title: task.label,
    type: "Operacion",
  };
}

async function loadTaskDetail(taskId: string): Promise<MobileTaskDetail | null> {
  if (!isSupabaseConfigured()) {
    return fallbackTask(taskId);
  }

  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("id,title,type,status,priority,due_at,description,properties(name)")
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
      properties?: Relation<{ name: string | null }>;
      status: string | null;
      title: string;
      type: string | null;
    };

    return {
      description: task.description ?? "Sin descripcion ampliada.",
      due: dueLabel(task.due_at),
      id: task.id,
      priority: label(task.priority),
      property: one(task.properties)?.name ?? "Propiedad sin asignar",
      status: label(task.status),
      statusValue: task.status ?? "open",
      title: task.title,
      type: label(task.type),
    };
  } catch {
    return fallbackTask(taskId);
  }
}

export function useTaskDetail(taskId: string | undefined) {
  return useQuery({
    enabled: Boolean(taskId),
    queryFn: () => loadTaskDetail(taskId ?? ""),
    queryKey: ["task-detail", taskId],
  });
}
