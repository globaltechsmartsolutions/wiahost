import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

type OwnerAccountRow = {
  company_name: string | null;
  display_name: string;
  id: string;
  payout_notes: string | null;
};

type PropertyRow = {
  base_price: number | string | null;
  id: string;
  name: string;
  owner_account_id: string | null;
  status: string;
};

type ReservationRow = {
  payout_amount: number | string | null;
  property_id: string;
  status: string;
  total_amount: number | string | null;
  properties?: Relation<{ owner_account_id: string | null }>;
};

type IncidentRow = {
  estimated_cost: number | string | null;
  id: string;
  property_id: string;
  status: string;
  properties?: Relation<{ owner_account_id: string | null }>;
};

export type OwnerMetric = {
  helper: string;
  label: string;
  value: string;
};

export type OwnerAssetSummary = {
  activeReservations: number;
  grossRevenue: string;
  id: string;
  incidents: number;
  name: string;
  status: string;
};

export type OwnerAccountSummary = {
  company: string;
  displayName: string;
  grossRevenue: string;
  id: string;
  netPayout: string;
  notes: string;
  properties: number;
};

export type OwnerPortalData = {
  assets: OwnerAssetSummary[];
  metrics: OwnerMetric[];
  owners: OwnerAccountSummary[];
};

const fallbackData: OwnerPortalData = {
  assets: [
    {
      activeReservations: 4,
      grossRevenue: "3.420 EUR",
      id: "demo-asset-1",
      incidents: 1,
      name: "Atico Gran Via Sky",
      status: "Activo",
    },
    {
      activeReservations: 2,
      grossRevenue: "1.680 EUR",
      id: "demo-asset-2",
      incidents: 0,
      name: "Loft Malaga Centro",
      status: "Activo",
    },
  ],
  metrics: [
    { helper: "Abril", label: "Ingresos brutos", value: "5.100 EUR" },
    {
      helper: "Limpieza, fees y mantenimiento",
      label: "Costes operativos",
      value: "620 EUR",
    },
    {
      helper: "Pendiente de aprobacion",
      label: "Payout neto",
      value: "4.480 EUR",
    },
  ],
  owners: [
    {
      company: "WIA Demo Assets",
      displayName: "Carlos Propietario",
      grossRevenue: "5.100 EUR",
      id: "demo-owner-1",
      netPayout: "4.480 EUR",
      notes: "Liquidacion mensual preparada.",
      properties: 2,
    },
  ],
};

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function money(value: number) {
  return `${new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0,
  }).format(value)} EUR`;
}

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function labelStatus(status: string) {
  const labels: Record<string, string> = {
    active: "Activo",
    archived: "Archivado",
    draft: "Borrador",
    paused: "Pausado",
  };

  return labels[status] ?? status;
}

function ownerIdFromRelation(
  item: ReservationRow | IncidentRow,
  propertyOwnerById: Map<string, string>,
) {
  return (
    one(item.properties)?.owner_account_id ??
    propertyOwnerById.get(item.property_id) ??
    null
  );
}

export async function getOwnerPortalData(): Promise<OwnerPortalData> {
  if (!isSupabaseConfigured()) {
    return fallbackData;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [
      { data: owners },
      { data: properties },
      { data: reservations },
      { data: incidents },
    ] = await Promise.all([
      supabase
        .from("owner_accounts")
        .select("id,display_name,company_name,payout_notes")
        .order("display_name", { ascending: true }),
      supabase
        .from("properties")
        .select("id,name,status,owner_account_id,base_price")
        .order("name", { ascending: true }),
      supabase
        .from("reservations")
        .select(
          "property_id,status,total_amount,payout_amount,properties(owner_account_id)",
        )
        .limit(500),
      supabase
        .from("incidents")
        .select(
          "id,property_id,status,estimated_cost,properties(owner_account_id)",
        )
        .limit(500),
    ]);

    const ownerRows = (owners ?? []) as OwnerAccountRow[];
    const propertyRows = (properties ?? []) as PropertyRow[];
    const reservationRows = (reservations ?? []) as ReservationRow[];
    const incidentRows = (incidents ?? []) as IncidentRow[];

    if (!ownerRows.length) {
      return fallbackData;
    }

    const propertyOwnerById = new Map(
      propertyRows
        .filter((property) => property.owner_account_id)
        .map((property) => [property.id, property.owner_account_id as string]),
    );
    const activeReservationStatuses = new Set([
      "confirmed",
      "checked_in",
      "checked_out",
    ]);
    const openIncidentStatuses = new Set(["open", "investigating"]);

    const grossRevenue = reservationRows
      .filter((reservation) =>
        activeReservationStatuses.has(reservation.status),
      )
      .reduce(
        (total, reservation) => total + numeric(reservation.total_amount),
        0,
      );
    const netPayout = reservationRows
      .filter((reservation) =>
        activeReservationStatuses.has(reservation.status),
      )
      .reduce(
        (total, reservation) => total + numeric(reservation.payout_amount),
        0,
      );
    const operatingCosts = incidentRows
      .filter((incident) => openIncidentStatuses.has(incident.status))
      .reduce((total, incident) => total + numeric(incident.estimated_cost), 0);

    const ownersSummary = ownerRows.map((owner) => {
      const ownerProperties = propertyRows.filter(
        (property) => property.owner_account_id === owner.id,
      );
      const ownerReservations = reservationRows.filter(
        (reservation) =>
          ownerIdFromRelation(reservation, propertyOwnerById) === owner.id,
      );
      const ownerGross = ownerReservations
        .filter((reservation) =>
          activeReservationStatuses.has(reservation.status),
        )
        .reduce(
          (total, reservation) => total + numeric(reservation.total_amount),
          0,
        );
      const ownerNet = ownerReservations
        .filter((reservation) =>
          activeReservationStatuses.has(reservation.status),
        )
        .reduce(
          (total, reservation) => total + numeric(reservation.payout_amount),
          0,
        );

      return {
        company: owner.company_name ?? "Sin sociedad",
        displayName: owner.display_name,
        grossRevenue: money(ownerGross),
        id: owner.id,
        netPayout: money(ownerNet),
        notes: owner.payout_notes ?? "Liquidacion pendiente de revision.",
        properties: ownerProperties.length,
      };
    });

    const assets = propertyRows.map((property) => {
      const propertyReservations = reservationRows.filter(
        (reservation) => reservation.property_id === property.id,
      );
      const propertyIncidents = incidentRows.filter(
        (incident) =>
          incident.property_id === property.id &&
          openIncidentStatuses.has(incident.status),
      );
      const propertyGross = propertyReservations
        .filter((reservation) =>
          activeReservationStatuses.has(reservation.status),
        )
        .reduce(
          (total, reservation) => total + numeric(reservation.total_amount),
          0,
        );

      return {
        activeReservations: propertyReservations.filter((reservation) =>
          activeReservationStatuses.has(reservation.status),
        ).length,
        grossRevenue: money(propertyGross),
        id: property.id,
        incidents: propertyIncidents.length,
        name: property.name,
        status: labelStatus(property.status),
      };
    });

    return {
      assets,
      metrics: [
        {
          helper: `${propertyRows.length} propiedades bajo gestion`,
          label: "Ingresos brutos",
          value: money(grossRevenue),
        },
        {
          helper: "Incidencias abiertas estimadas",
          label: "Costes operativos",
          value: money(operatingCosts),
        },
        {
          helper: "Reservas confirmadas y en estancia",
          label: "Payout neto",
          value: money(netPayout),
        },
      ],
      owners: ownersSummary,
    };
  } catch {
    return fallbackData;
  }
}
