import type { GuestInput } from "@wiahost/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export class GuestMutationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mutationError(code: string, message: string): never {
  throw new GuestMutationError(code, message);
}

export async function createGuest(
  supabase: SupabaseServerClient,
  input: GuestInput,
) {
  const { data, error } = await supabase
    .from("guests")
    .insert({
      email: input.email || null,
      full_name: input.fullName,
      notes: input.notes ?? null,
      phone: input.phone || null,
      preferred_language: input.preferredLanguage || "es",
      tags: [],
    })
    .select("id,full_name,email")
    .single();

  if (error || !data) {
    mutationError("guest_create_failed", "No se ha podido crear el huesped.");
  }

  return data;
}
