import { createHash, timingSafeEqual } from "node:crypto";

import type { NextResponse } from "next/server";

import { apiError } from "@/lib/api/responses";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type PartnerConfig = {
  key: string;
  partnerId: string;
};

type ResolvePartnerOptions = {
  requestedPartner?: string | null;
};

type ResolvePartnerResult =
  | {
      authMode: "configured" | "local_unsecured" | "partner_app";
      ok: true;
      partnerId: string;
      rateLimitPerMinute: number;
    }
  | {
      ok: false;
      response: NextResponse;
    };

type PartnerAppRow = {
  partner_id: string;
  rate_limit_per_minute: number | null;
  status: string;
};

type PartnerAppLookupError = {
  code?: string;
  message?: string;
};

type PartnerAppQuery = {
  eq(column: string, value: unknown): PartnerAppQuery;
  limit(count: number): PartnerAppQuery;
  maybeSingle(): Promise<{
    data: PartnerAppRow | null;
    error: PartnerAppLookupError | null;
  }>;
  select(columns: string): PartnerAppQuery;
};

type PartnerAppClient = {
  from(table: "partner_apps"): PartnerAppQuery;
};

function clean(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function defaultRateLimitPerMinute() {
  const configured = Number.parseInt(
    clean(process.env.WIAHOST_PUBLIC_API_RATE_LIMIT_PER_MINUTE),
    10,
  );

  return Number.isFinite(configured) && configured > 0 ? configured : 120;
}

export function hashPublicApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

function parsePartnerConfigs() {
  const raw = clean(process.env.WIAHOST_PUBLIC_API_KEYS);

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => {
      const [partnerId, ...keyParts] = entry.split(":");

      return {
        key: keyParts.join(":").trim(),
        partnerId: partnerId.trim(),
      };
    })
    .filter((entry): entry is PartnerConfig =>
      Boolean(entry.partnerId && entry.key),
    );
}

function bearerToken(request: Request) {
  const authorization = clean(request.headers.get("authorization"));

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function requestToken(request: Request) {
  return clean(request.headers.get("x-wiahost-partner-key")) || bearerToken(request);
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function findMatchingPartner(configs: PartnerConfig[], token: string) {
  return configs.find((config) => safeEqual(config.key, token));
}

function partnerAppsClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    return getSupabaseAdminClient() as unknown as PartnerAppClient;
  } catch {
    return null;
  }
}

async function findPartnerAppByToken(token: string) {
  const supabase = partnerAppsClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("partner_apps")
    .select("partner_id,status,rate_limit_per_minute")
    .eq("key_hash", hashPublicApiKey(token))
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

async function hasActivePartnerApps() {
  const supabase = partnerAppsClient();

  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from("partner_apps")
    .select("partner_id,status,rate_limit_per_minute")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

function forbiddenPartnerResponse() {
  return apiError(
    "public_partner_forbidden",
    "La clave indicada no tiene acceso a este partner.",
    403,
  );
}

function missingPartnerKeyResponse() {
  return apiError(
    "public_partner_auth_required",
    "Falta la clave del partner para usar esta API.",
    401,
  );
}

function invalidPartnerKeyResponse() {
  return apiError(
    "public_partner_auth_invalid",
    "La clave del partner no es válida.",
    401,
  );
}

export async function resolvePublicApiPartner(
  request: Request,
  options: ResolvePartnerOptions = {},
): Promise<ResolvePartnerResult> {
  const requestedPartner = clean(options.requestedPartner);
  const configs = parsePartnerConfigs();
  const token = requestToken(request);

  if (token) {
    const partnerApp = await findPartnerAppByToken(token);

    if (partnerApp) {
      if (requestedPartner && requestedPartner !== partnerApp.partner_id) {
        return {
          ok: false,
          response: forbiddenPartnerResponse(),
        };
      }

      return {
        authMode: "partner_app",
        ok: true,
        partnerId: partnerApp.partner_id,
        rateLimitPerMinute:
          partnerApp.rate_limit_per_minute ?? defaultRateLimitPerMinute(),
      };
    }

    const envPartner = findMatchingPartner(configs, token);

    if (!envPartner) {
      return {
        ok: false,
        response: invalidPartnerKeyResponse(),
      };
    }

    if (requestedPartner && requestedPartner !== envPartner.partnerId) {
      return {
        ok: false,
        response: forbiddenPartnerResponse(),
      };
    }

    return {
      authMode: "configured",
      ok: true,
      partnerId: envPartner.partnerId,
      rateLimitPerMinute: defaultRateLimitPerMinute(),
    };
  }

  if (configs.length || (await hasActivePartnerApps())) {
    return {
      ok: false,
      response: missingPartnerKeyResponse(),
    };
  }

  return {
    authMode: "local_unsecured",
    ok: true,
    partnerId: requestedPartner,
    rateLimitPerMinute: defaultRateLimitPerMinute(),
  };
}

export function checkPublicApiPartnerRateLimit(
  request: Request,
  partner: Extract<ResolvePartnerResult, { ok: true }>,
  namespace: string,
) {
  return checkRateLimit(request, {
    identity: `${partner.authMode}:${partner.partnerId || "unscoped"}`,
    limit: partner.rateLimitPerMinute,
    namespace,
    windowMs: 60_000,
  });
}
