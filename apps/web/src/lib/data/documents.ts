import {
  incidents as demoIncidents,
  properties as demoProperties,
  reservations as demoReservations,
} from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

type DocumentRow = {
  created_at: string;
  id: string;
  incident_id: string | null;
  incidents?: Relation<{
    title: string | null;
    properties?: Relation<{ name: string | null }>;
  }>;
  mime_type: string | null;
  property_id: string | null;
  properties?: Relation<{ name: string | null }>;
  reservation_id: string | null;
  reservations?: Relation<{
    check_in: string | null;
    check_out: string | null;
    guests?: Relation<{ full_name: string | null }>;
    properties?: Relation<{ name: string | null }>;
  }>;
  storage_path: string;
  title: string;
};

type PropertyOptionRow = {
  id: string;
  internal_name: string | null;
  name: string;
};

type ReservationOptionRow = {
  check_in: string | null;
  check_out: string | null;
  guests?: Relation<{ full_name: string | null }>;
  id: string;
  properties?: Relation<{ name: string | null }>;
};

type IncidentOptionRow = {
  id: string;
  properties?: Relation<{ name: string | null }>;
  title: string;
};

export type DocumentListItem = {
  context: string;
  createdAt: string;
  id: string;
  mimeType: string;
  property: string;
  raw: {
    incidentId?: string;
    mimeType?: string;
    propertyId?: string;
    reservationId?: string;
    storagePath: string;
    title: string;
  };
  storagePath: string;
  title: string;
};

export type DocumentFormOptions = {
  incidents: Array<{ helper?: string; id: string; label: string }>;
  properties: Array<{ helper?: string; id: string; label: string }>;
  reservations: Array<{ helper?: string; id: string; label: string }>;
};

const fallbackDocuments: DocumentListItem[] = [
  {
    context: "Reserva: Sofia Martin - Atico Gran Via Sky",
    createdAt: "Demo",
    id: "demo-document-1",
    mimeType: "application/pdf",
    property: "Atico Gran Via Sky",
    raw: {
      mimeType: "application/pdf",
      propertyId: demoProperties[0]?.id,
      reservationId: demoReservations[0]?.id,
      storagePath: "reservation-documents/demo/checkin.pdf",
      title: "Evidencia de check-in",
    },
    storagePath: "reservation-documents/demo/checkin.pdf",
    title: "Evidencia de check-in",
  },
];

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

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

function dateRange(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
) {
  if (!checkIn || !checkOut) {
    return "Sin fechas";
  }

  return `${shortDate(checkIn)} - ${shortDate(checkOut)}`;
}

function buildDocumentContext(row: DocumentRow) {
  const reservation = one(row.reservations);
  const incident = one(row.incidents);

  if (reservation && row.reservation_id) {
    const guest = one(reservation.guests)?.full_name ?? "Huesped";
    const property = one(reservation.properties)?.name ?? "Propiedad";
    return `Reserva: ${guest} - ${property}`;
  }

  if (incident && row.incident_id) {
    return `Incidencia: ${incident.title ?? "Sin titulo"}`;
  }

  if (row.property_id) {
    return `Propiedad: ${one(row.properties)?.name ?? "Sin nombre"}`;
  }

  return "Documento general de operaciones";
}

function propertyLabel(row: DocumentRow) {
  return (
    one(row.properties)?.name ??
    one(one(row.reservations)?.properties)?.name ??
    one(one(row.incidents)?.properties)?.name ??
    "Sin propiedad vinculada"
  );
}

function mapDocument(row: DocumentRow): DocumentListItem {
  return {
    context: buildDocumentContext(row),
    createdAt: shortDate(row.created_at),
    id: row.id,
    mimeType: row.mime_type ?? "Sin tipo MIME",
    property: propertyLabel(row),
    raw: {
      incidentId: row.incident_id ?? undefined,
      mimeType: row.mime_type ?? undefined,
      propertyId: row.property_id ?? undefined,
      reservationId: row.reservation_id ?? undefined,
      storagePath: row.storage_path,
      title: row.title,
    },
    storagePath: row.storage_path,
    title: row.title,
  };
}

export async function getDocuments(): Promise<DocumentListItem[]> {
  if (!isSupabaseConfigured()) {
    return fallbackDocuments;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("documents")
      .select(
        "id,title,storage_path,mime_type,property_id,reservation_id,incident_id,created_at,properties(name),reservations(check_in,check_out,properties(name),guests(full_name)),incidents(title,properties(name))",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) {
      return fallbackDocuments;
    }

    return (data as DocumentRow[]).map(mapDocument);
  } catch {
    return fallbackDocuments;
  }
}

export async function getDocumentDetail(
  documentId: string,
): Promise<DocumentListItem | null> {
  if (!isSupabaseConfigured()) {
    return (
      fallbackDocuments.find((document) => document.id === documentId) ?? null
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("documents")
      .select(
        "id,title,storage_path,mime_type,property_id,reservation_id,incident_id,created_at,properties(name),reservations(check_in,check_out,properties(name),guests(full_name)),incidents(title,properties(name))",
      )
      .eq("id", documentId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapDocument(data as DocumentRow);
  } catch {
    return null;
  }
}

export async function getDocumentFormOptions(): Promise<DocumentFormOptions> {
  const fallbackOptions = {
    incidents: demoIncidents.map((incident) => ({
      helper: incident.property,
      id: incident.id,
      label: incident.title,
    })),
    properties: demoProperties.map((property) => ({
      helper: property.city,
      id: property.id,
      label: property.name,
    })),
    reservations: demoReservations.map((reservation) => ({
      helper: reservation.dates,
      id: reservation.id,
      label: `${reservation.guest} - ${reservation.property}`,
    })),
  };

  if (!isSupabaseConfigured()) {
    return fallbackOptions;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: properties }, { data: reservations }, { data: incidents }] =
      await Promise.all([
        supabase
          .from("properties")
          .select("id,name,internal_name")
          .neq("status", "archived")
          .order("name", { ascending: true }),
        supabase
          .from("reservations")
          .select("id,check_in,check_out,properties(name),guests(full_name)")
          .order("check_in", { ascending: false })
          .limit(80),
        supabase
          .from("incidents")
          .select("id,title,properties(name)")
          .order("created_at", { ascending: false })
          .limit(80),
      ]);

    return {
      incidents: ((incidents ?? []) as IncidentOptionRow[]).map((incident) => ({
        helper: one(incident.properties)?.name ?? "Sin propiedad",
        id: incident.id,
        label: incident.title,
      })),
      properties: ((properties ?? []) as PropertyOptionRow[]).map(
        (property) => ({
          helper: property.internal_name ?? property.id.slice(0, 8),
          id: property.id,
          label: property.name,
        }),
      ),
      reservations: ((reservations ?? []) as ReservationOptionRow[]).map(
        (reservation) => ({
          helper: dateRange(reservation.check_in, reservation.check_out),
          id: reservation.id,
          label: `${one(reservation.guests)?.full_name ?? "Huesped"} - ${one(reservation.properties)?.name ?? "Propiedad"}`,
        }),
      ),
    };
  } catch {
    return fallbackOptions;
  }
}
