import { properties as demoProperties } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

type OwnerStatementRow = {
  cleaning_costs: number | string | null;
  gross_revenue: number | string | null;
  id: string;
  maintenance_costs: number | string | null;
  net_payout: number | string | null;
  owner_account_id: string;
  owner_accounts?: Relation<{
    company_name: string | null;
    display_name: string | null;
  }>;
  period_end: string;
  period_start: string;
  platform_fees: number | string | null;
  properties?: Relation<{ name: string | null }>;
  property_id: string | null;
  status: string;
};

type OwnerAccountOptionRow = {
  company_name: string | null;
  display_name: string;
  id: string;
};

type PropertyOptionRow = {
  id: string;
  internal_name: string | null;
  name: string;
};

export type OwnerStatementListItem = {
  costs: string;
  grossRevenue: string;
  id: string;
  netPayout: string;
  owner: string;
  period: string;
  property: string;
  raw: {
    cleaningCosts: number;
    grossRevenue: number;
    maintenanceCosts: number;
    netPayout: number;
    ownerAccountId: string;
    periodEnd: string;
    periodStart: string;
    platformFees: number;
    propertyId?: string;
    status: string;
  };
  status: string;
};

export type OwnerStatementFormOptions = {
  owners: Array<{ helper?: string; id: string; label: string }>;
  properties: Array<{ helper?: string; id: string; label: string }>;
};

export const ownerStatementStatusOptions = [
  { label: "Pendiente", value: "pending" },
  { label: "Sincronizada", value: "synced" },
  { label: "Fallida", value: "failed" },
  { label: "Ignorada", value: "ignored" },
];

const fallbackStatements: OwnerStatementListItem[] = [
  {
    costs: "620 EUR",
    grossRevenue: "5.100 EUR",
    id: "demo-owner-statement-1",
    netPayout: "4.480 EUR",
    owner: "Carlos Propietario",
    period: "01 abr - 30 abr",
    property: "Portfolio completo",
    raw: {
      cleaningCosts: 260,
      grossRevenue: 5100,
      maintenanceCosts: 160,
      netPayout: 4480,
      ownerAccountId: "10000000-0000-0000-0000-000000000001",
      periodEnd: "2026-04-30",
      periodStart: "2026-04-01",
      platformFees: 200,
      status: "pending",
    },
    status: "Pendiente",
  },
];

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function numeric(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: number | string | null | undefined) {
  return `${new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0,
  }).format(numeric(value))} EUR`;
}

function shortDate(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  return (
    ownerStatementStatusOptions.find((option) => option.value === status)
      ?.label ?? status
  );
}

function mapStatement(row: OwnerStatementRow): OwnerStatementListItem {
  const owner = one(row.owner_accounts);
  const costs =
    numeric(row.platform_fees) +
    numeric(row.cleaning_costs) +
    numeric(row.maintenance_costs);

  return {
    costs: money(costs),
    grossRevenue: money(row.gross_revenue),
    id: row.id,
    netPayout: money(row.net_payout),
    owner: owner?.display_name ?? "Propietario sin asignar",
    period: `${shortDate(row.period_start)} - ${shortDate(row.period_end)}`,
    property: one(row.properties)?.name ?? "Portfolio completo",
    raw: {
      cleaningCosts: numeric(row.cleaning_costs),
      grossRevenue: numeric(row.gross_revenue),
      maintenanceCosts: numeric(row.maintenance_costs),
      netPayout: numeric(row.net_payout),
      ownerAccountId: row.owner_account_id,
      periodEnd: row.period_end,
      periodStart: row.period_start,
      platformFees: numeric(row.platform_fees),
      propertyId: row.property_id ?? undefined,
      status: row.status,
    },
    status: statusLabel(row.status),
  };
}

export async function getOwnerStatements(): Promise<OwnerStatementListItem[]> {
  if (!isSupabaseConfigured()) {
    return fallbackStatements;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("owner_statements")
      .select(
        "id,owner_account_id,property_id,period_start,period_end,gross_revenue,platform_fees,cleaning_costs,maintenance_costs,net_payout,status,owner_accounts(display_name,company_name),properties(name)",
      )
      .order("period_start", { ascending: false })
      .limit(100);

    if (error || !data) {
      return fallbackStatements;
    }

    return (data as OwnerStatementRow[]).map(mapStatement);
  } catch {
    return fallbackStatements;
  }
}

export async function getOwnerStatementDetail(
  statementId: string,
): Promise<OwnerStatementListItem | null> {
  if (!isSupabaseConfigured()) {
    return (
      fallbackStatements.find((statement) => statement.id === statementId) ??
      null
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("owner_statements")
      .select(
        "id,owner_account_id,property_id,period_start,period_end,gross_revenue,platform_fees,cleaning_costs,maintenance_costs,net_payout,status,owner_accounts(display_name,company_name),properties(name)",
      )
      .eq("id", statementId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapStatement(data as OwnerStatementRow);
  } catch {
    return null;
  }
}

export async function getOwnerStatementFormOptions(): Promise<OwnerStatementFormOptions> {
  const fallbackOptions = {
    owners: [
      {
        helper: "WIA Demo Assets",
        id: "10000000-0000-0000-0000-000000000001",
        label: "Carlos Propietario",
      },
    ],
    properties: demoProperties.map((property) => ({
      helper: property.city,
      id: property.id,
      label: property.name,
    })),
  };

  if (!isSupabaseConfigured()) {
    return fallbackOptions;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [{ data: owners }, { data: properties }] = await Promise.all([
      supabase
        .from("owner_accounts")
        .select("id,display_name,company_name")
        .order("display_name", { ascending: true }),
      supabase
        .from("properties")
        .select("id,name,internal_name")
        .neq("status", "archived")
        .order("name", { ascending: true }),
    ]);

    return {
      owners: ((owners ?? []) as OwnerAccountOptionRow[]).map((owner) => ({
        helper: owner.company_name ?? undefined,
        id: owner.id,
        label: owner.display_name,
      })),
      properties: ((properties ?? []) as PropertyOptionRow[]).map(
        (property) => ({
          helper: property.internal_name ?? property.id.slice(0, 8),
          id: property.id,
          label: property.name,
        }),
      ),
    };
  } catch {
    return fallbackOptions;
  }
}
