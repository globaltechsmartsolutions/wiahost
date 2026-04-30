import { useQuery } from "@tanstack/react-query";

import { demoIncidents } from "@/src/lib/demo-data";
import { readOfflineCache, writeOfflineCache } from "@/src/lib/offline-cache";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

type Relation<T> = T | T[] | null | undefined;

export type MobileIncidentDetail = {
  cachedAt?: string;
  cost: string;
  id: string;
  property: string;
  source: "cache" | "demo" | "live";
  severity: string;
  status: string;
  statusValue: string;
  title: string;
};

const incidentDetailCacheKey = (incidentId: string) =>
  `incident-detail-v1:${incidentId}`;

const statusLabels: Record<string, string> = {
  cancelled: "Cancelada",
  charged: "Cobrada",
  investigating: "Investigando",
  open: "Abierta",
  resolved: "Resuelta",
};

const severityLabels: Record<string, string> = {
  critical: "Critica",
  high: "Alta",
  low: "Baja",
  medium: "Media",
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

  return statusLabels[value] ?? severityLabels[value] ?? value;
}

function money(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return `${new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)} EUR`;
}

function fallbackIncident(incidentId: string): MobileIncidentDetail | null {
  const incident = demoIncidents.find((item) => item.id === incidentId);

  if (!incident) {
    return null;
  }

  return {
    ...incident,
    source: "demo",
  };
}

async function cachedIncident(incidentId: string) {
  const cached = await readOfflineCache<MobileIncidentDetail>(
    incidentDetailCacheKey(incidentId),
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

async function loadIncidentDetail(
  incidentId: string,
): Promise<MobileIncidentDetail | null> {
  if (!isSupabaseConfigured()) {
    return fallbackIncident(incidentId);
  }

  try {
    const { data, error } = await supabase
      .from("incidents")
      .select("id,title,status,severity,estimated_cost,properties(name)")
      .eq("id", incidentId)
      .single();

    if (error || !data) {
      return fallbackIncident(incidentId);
    }

    const row = data as {
      estimated_cost: number | string | null;
      id: string;
      properties?: Relation<{ name: string | null }>;
      severity: string | null;
      status: string | null;
      title: string;
    };
    const detail = {
      cost: row.estimated_cost
        ? `${money(row.estimated_cost)} estimados`
        : "Coste pendiente",
      id: row.id,
      property: one(row.properties)?.name ?? "Propiedad sin asignar",
      source: "live" as const,
      severity: label(row.severity),
      status: label(row.status),
      statusValue: row.status ?? "open",
      title: row.title,
    };

    await writeOfflineCache(incidentDetailCacheKey(incidentId), detail);

    return detail;
  } catch {
    return (await cachedIncident(incidentId)) ?? fallbackIncident(incidentId);
  }
}

export function useIncidentDetail(incidentId: string | undefined) {
  return useQuery({
    enabled: Boolean(incidentId),
    queryFn: () => loadIncidentDetail(incidentId ?? ""),
    queryKey: ["incident-detail", incidentId],
  });
}
