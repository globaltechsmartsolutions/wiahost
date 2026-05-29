import type {
  PartnerAppInput,
  PartnerAppUpdateInput,
} from "@wiahost/shared";

import { hashPublicApiKey } from "@/lib/public-api/partners";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export class PartnerAppMutationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mutationError(code: string, message: string): never {
  throw new PartnerAppMutationError(code, message);
}

function optionalValue(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

function keyFields(apiKey: string | undefined) {
  if (!apiKey) {
    return {};
  }

  return {
    key_hash: hashPublicApiKey(apiKey),
    key_prefix: apiKey.slice(0, 10),
  };
}

function toPartnerAppPayload(input: PartnerAppInput | PartnerAppUpdateInput) {
  return {
    allowed_origins: input.allowedOrigins,
    display_name: input.displayName.trim(),
    notes: optionalValue(input.notes),
    partner_id: input.partnerId,
    rate_limit_per_minute: input.rateLimitPerMinute,
    redirect_urls: input.redirectUrls,
    scopes: input.scopes,
    status: input.status,
    webhook_url: optionalValue(input.webhookUrl),
    ...keyFields(input.apiKey),
  };
}

export async function createPartnerApp(
  supabase: SupabaseServerClient,
  input: PartnerAppInput,
) {
  const { data, error } = await supabase
    .from("partner_apps")
    .insert(toPartnerAppPayload(input))
    .select("id,partner_id,status")
    .single();

  if (error || !data) {
    mutationError(
      "partner_app_create_failed",
      "No se ha podido crear la web conectada.",
    );
  }

  return data;
}

export async function updatePartnerApp(
  supabase: SupabaseServerClient,
  partnerAppId: string,
  input: PartnerAppUpdateInput,
) {
  const { data, error } = await supabase
    .from("partner_apps")
    .update(toPartnerAppPayload(input))
    .eq("id", partnerAppId)
    .select("id,partner_id,status")
    .single();

  if (error || !data) {
    mutationError(
      "partner_app_update_failed",
      "No se ha podido actualizar la web conectada.",
    );
  }

  return data;
}

export async function deletePartnerApp(
  supabase: SupabaseServerClient,
  partnerAppId: string,
) {
  const { data, error } = await supabase
    .from("partner_apps")
    .delete()
    .eq("id", partnerAppId)
    .select("id")
    .single();

  if (error || !data) {
    mutationError(
      "partner_app_delete_failed",
      "No se ha podido eliminar la web conectada.",
    );
  }

  return data;
}
