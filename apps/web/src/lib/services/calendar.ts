import type { CalendarBlockInput } from "@wiahost/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export class CalendarMutationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mutationError(code: string, message: string): never {
  throw new CalendarMutationError(code, message);
}

export async function createCalendarBlock(
  supabase: SupabaseServerClient,
  input: CalendarBlockInput,
) {
  const { data, error } = await supabase
    .from("calendar_blocks")
    .insert({
      end_date: input.endDate,
      property_id: input.propertyId,
      reason: input.reason,
      source: input.source,
      start_date: input.startDate,
    })
    .select("id,property_id,start_date,end_date,reason")
    .single();

  if (error || !data) {
    mutationError(
      "calendar_block_create_failed",
      "No se ha podido crear el bloqueo.",
    );
  }

  return data;
}
