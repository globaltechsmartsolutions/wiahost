import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

type CalendarBlockRow = {
  end_date: string;
  id: string;
  property_id: string;
  properties?: Relation<{
    internal_name?: string | null;
    name: string | null;
  }>;
  reason: string;
  source: string;
  start_date: string;
};

export type CalendarBlockListItem = {
  dates: string;
  id: string;
  property: string;
  propertyCode: string;
  raw: {
    endDate: string;
    propertyId: string;
    reason: string;
    source: string;
    startDate: string;
  };
  reason: string;
  source: string;
};

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function dateRange(startDate: string, endDate: string) {
  return `${shortDate(startDate)} - ${shortDate(endDate)}`;
}

function mapCalendarBlock(row: CalendarBlockRow): CalendarBlockListItem {
  const property = one(row.properties);

  return {
    dates: dateRange(row.start_date, row.end_date),
    id: row.id,
    property: property?.name ?? "Propiedad sin asignar",
    propertyCode: property?.internal_name ?? row.property_id.slice(0, 8),
    raw: {
      endDate: row.end_date,
      propertyId: row.property_id,
      reason: row.reason,
      source: row.source,
      startDate: row.start_date,
    },
    reason: row.reason,
    source: row.source,
  };
}

export async function getCalendarBlocks(): Promise<CalendarBlockListItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("calendar_blocks")
      .select(
        "id,property_id,start_date,end_date,reason,source,properties(name,internal_name)",
      )
      .order("start_date", { ascending: true })
      .limit(50);

    if (error || !data) {
      return [];
    }

    return (data as CalendarBlockRow[]).map(mapCalendarBlock);
  } catch {
    return [];
  }
}

export async function getCalendarBlockDetail(
  blockId: string,
): Promise<CalendarBlockListItem | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("calendar_blocks")
      .select(
        "id,property_id,start_date,end_date,reason,source,properties(name,internal_name)",
      )
      .eq("id", blockId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapCalendarBlock(data as CalendarBlockRow);
  } catch {
    return null;
  }
}
