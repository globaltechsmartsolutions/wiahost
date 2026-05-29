import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PartnerAppRow = {
  allowed_origins: unknown;
  created_at: string;
  display_name: string;
  id: string;
  key_prefix: string | null;
  notes: string | null;
  partner_id: string;
  rate_limit_per_minute: number;
  redirect_urls: unknown;
  scopes: unknown;
  status: string;
  updated_at: string;
  webhook_url: string | null;
};

export type PartnerAppListItem = {
  allowedOrigins: string;
  createdAt: string;
  displayName: string;
  id: string;
  keyPrefix: string;
  notes: string;
  partnerId: string;
  rateLimitPerMinute: number;
  raw: {
    allowedOrigins: string[];
    displayName: string;
    notes?: string;
    partnerId: string;
    rateLimitPerMinute: number;
    redirectUrls: string[];
    scopes: string[];
    status: string;
    webhookUrl?: string;
  };
  redirectUrls: string;
  scopes: string;
  status: string;
  updatedAt: string;
  webhookUrl: string;
};

export const partnerAppStatusOptions = [
  { label: "Borrador", value: "draft" },
  { label: "Activo", value: "active" },
  { label: "Pausado", value: "paused" },
  { label: "Revocado", value: "revoked" },
];

export const partnerAppDefaultScopes = [
  "listings",
  "availability",
  "inquiries",
  "reservations:read",
];

const fallbackPartnerApps: PartnerAppListItem[] = [
  {
    allowedOrigins: "http://localhost:5500",
    createdAt: "Demo",
    displayName: "World Institutional Assets",
    id: "demo-partner-app-wia",
    keyPrefix: "Sin clave",
    notes: "Partner app demo para validar la web WIA como primer cliente.",
    partnerId: "worldinstitutionalassets",
    rateLimitPerMinute: 60,
    raw: {
      allowedOrigins: ["http://localhost:5500"],
      displayName: "World Institutional Assets",
      notes: "Partner app demo para validar la web WIA como primer cliente.",
      partnerId: "worldinstitutionalassets",
      rateLimitPerMinute: 60,
      redirectUrls: ["http://localhost:5500"],
      scopes: partnerAppDefaultScopes,
      status: "draft",
      webhookUrl: undefined,
    },
    redirectUrls: "http://localhost:5500",
    scopes: partnerAppDefaultScopes.join(", "),
    status: "Borrador",
    updatedAt: "Demo",
    webhookUrl: "Sin webhook",
  },
];

function labelFromOptions(
  options: Array<{ label: string; value: string }>,
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function shortDate(value: string | null | undefined) {
  if (!value) {
    return "Nunca";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function listSummary(items: string[]) {
  return items.length ? items.join(", ") : "Sin configurar";
}

function mapPartnerApp(row: PartnerAppRow): PartnerAppListItem {
  const allowedOrigins = stringArray(row.allowed_origins);
  const redirectUrls = stringArray(row.redirect_urls);
  const scopes = stringArray(row.scopes);

  return {
    allowedOrigins: listSummary(allowedOrigins),
    createdAt: shortDate(row.created_at),
    displayName: row.display_name,
    id: row.id,
    keyPrefix: row.key_prefix ? `${row.key_prefix}...` : "Sin clave",
    notes: row.notes ?? "Sin notas",
    partnerId: row.partner_id,
    rateLimitPerMinute: row.rate_limit_per_minute,
    raw: {
      allowedOrigins,
      displayName: row.display_name,
      notes: row.notes ?? undefined,
      partnerId: row.partner_id,
      rateLimitPerMinute: row.rate_limit_per_minute,
      redirectUrls,
      scopes,
      status: row.status,
      webhookUrl: row.webhook_url ?? undefined,
    },
    redirectUrls: listSummary(redirectUrls),
    scopes: listSummary(scopes),
    status: labelFromOptions(partnerAppStatusOptions, row.status),
    updatedAt: shortDate(row.updated_at),
    webhookUrl: row.webhook_url ?? "Sin webhook",
  };
}

export async function getPartnerApps(): Promise<PartnerAppListItem[]> {
  if (!isSupabaseConfigured()) {
    return fallbackPartnerApps;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("partner_apps")
      .select(
        "id,partner_id,display_name,status,key_prefix,allowed_origins,redirect_urls,webhook_url,scopes,rate_limit_per_minute,notes,created_at,updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error || !data) {
      return fallbackPartnerApps;
    }

    return (data as PartnerAppRow[]).map(mapPartnerApp);
  } catch {
    return fallbackPartnerApps;
  }
}
