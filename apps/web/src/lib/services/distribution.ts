import type {
  ChannelSyncEventInput,
  IcalImportInput,
  ListingInput,
} from "@wiahost/shared";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

export class DistributionMutationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function mutationError(code: string, message: string): never {
  throw new DistributionMutationError(code, message);
}

function optionalValue(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

function toListingPayload(input: ListingInput) {
  return {
    channel: input.channel,
    channel_url: optionalValue(input.channelUrl),
    external_listing_id: optionalValue(input.externalListingId),
    property_id: input.propertyId,
    public_slug: optionalValue(input.publicSlug),
    status: input.status,
    sync_enabled: input.syncEnabled,
    sync_notes: optionalValue(input.syncNotes),
    title: input.title.trim(),
  };
}

function toSyncEventPayload(input: ChannelSyncEventInput) {
  return {
    channel: input.channel,
    direction: input.direction,
    error_message: optionalValue(input.errorMessage),
    listing_id: optionalValue(input.listingId),
    payload: input.payload,
    property_id: optionalValue(input.propertyId),
    status: input.status,
  };
}

function unfoldIcalLines(icalText: string) {
  return icalText
    .replace(/\r?\n[ \t]/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function readIcalValue(lines: string[], field: string) {
  const line = lines.find(
    (item) => item.startsWith(`${field}:`) || item.startsWith(`${field};`),
  );

  if (!line) {
    return null;
  }

  const separatorIndex = line.indexOf(":");
  return separatorIndex >= 0 ? line.slice(separatorIndex + 1).trim() : null;
}

function parseIcalDate(value: string | null) {
  if (!value) {
    return null;
  }

  const datePart = value.slice(0, 8);

  if (/^\d{8}$/.test(datePart)) {
    return `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function addOneDay(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function parseIcalEvents(input: IcalImportInput) {
  const lines = unfoldIcalLines(input.icalText);
  const events: Array<{
    endDate: string;
    reason: string;
    startDate: string;
  }> = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index] !== "BEGIN:VEVENT") {
      continue;
    }

    const eventLines: string[] = [];
    index += 1;

    while (index < lines.length && lines[index] !== "END:VEVENT") {
      eventLines.push(lines[index]);
      index += 1;
    }

    const startDate = parseIcalDate(readIcalValue(eventLines, "DTSTART"));
    const parsedEndDate = parseIcalDate(readIcalValue(eventLines, "DTEND"));

    if (!startDate) {
      continue;
    }

    const endDate =
      parsedEndDate && parsedEndDate > startDate
        ? parsedEndDate
        : addOneDay(startDate);
    const summary = readIcalValue(eventLines, "SUMMARY") ?? "Bloque iCal";

    events.push({
      endDate,
      reason: `iCal ${input.sourceName}: ${summary}`.slice(0, 180),
      startDate,
    });
  }

  return events.slice(0, 100);
}

export async function createListing(
  supabase: SupabaseServerClient,
  input: ListingInput,
) {
  const { data, error } = await supabase
    .from("property_listings")
    .insert(toListingPayload(input))
    .select("id,title,status")
    .single();

  if (error || !data) {
    mutationError(
      "listing_create_failed",
      "No se ha podido crear la publicacion.",
    );
  }

  return data;
}

export async function updateListing(
  supabase: SupabaseServerClient,
  listingId: string,
  input: ListingInput,
) {
  const { data, error } = await supabase
    .from("property_listings")
    .update(toListingPayload(input))
    .eq("id", listingId)
    .select("id,title,status")
    .single();

  if (error || !data) {
    mutationError(
      "listing_update_failed",
      "No se ha podido actualizar la publicacion.",
    );
  }

  return data;
}

export async function deleteListing(
  supabase: SupabaseServerClient,
  listingId: string,
) {
  const { data, error } = await supabase
    .from("property_listings")
    .delete()
    .eq("id", listingId)
    .select("id")
    .single();

  if (error || !data) {
    mutationError(
      "listing_delete_failed",
      "No se ha podido eliminar la publicacion.",
    );
  }

  return data;
}

export async function createSyncEvent(
  supabase: SupabaseServerClient,
  input: ChannelSyncEventInput,
) {
  const { data, error } = await supabase
    .from("channel_sync_events")
    .insert(toSyncEventPayload(input))
    .select("id,status,channel")
    .single();

  if (error || !data) {
    mutationError(
      "sync_event_create_failed",
      "No se ha podido registrar el evento de sincronizacion.",
    );
  }

  return data;
}

export async function importIcalBlocks(
  supabase: SupabaseServerClient,
  input: IcalImportInput,
) {
  const parsedEvents = parseIcalEvents(input);

  if (!parsedEvents.length) {
    mutationError(
      "ical_import_empty",
      "No se han encontrado eventos validos en el iCal.",
    );
  }

  const minStart = parsedEvents.reduce(
    (min, event) => (event.startDate < min ? event.startDate : min),
    parsedEvents[0]!.startDate,
  );
  const maxEnd = parsedEvents.reduce(
    (max, event) => (event.endDate > max ? event.endDate : max),
    parsedEvents[0]!.endDate,
  );

  const { data: existingBlocks, error: existingError } = await supabase
    .from("calendar_blocks")
    .select("start_date,end_date,reason")
    .eq("property_id", input.propertyId)
    .eq("source", input.channel)
    .gte("start_date", minStart)
    .lte("end_date", maxEnd);

  if (existingError) {
    mutationError(
      "ical_existing_blocks_failed",
      "No se han podido revisar bloqueos existentes.",
    );
  }

  const existingKeys = new Set(
    (existingBlocks ?? []).map(
      (block) => `${block.start_date}|${block.end_date}|${block.reason}`,
    ),
  );
  const newEvents = parsedEvents.filter(
    (event) =>
      !existingKeys.has(`${event.startDate}|${event.endDate}|${event.reason}`),
  );

  if (newEvents.length) {
    const { error: insertError } = await supabase
      .from("calendar_blocks")
      .insert(
        newEvents.map((event) => ({
          end_date: event.endDate,
          property_id: input.propertyId,
          reason: event.reason,
          source: input.channel,
          start_date: event.startDate,
        })),
      );

    if (insertError) {
      mutationError(
        "ical_blocks_insert_failed",
        "No se han podido crear los bloqueos iCal.",
      );
    }
  }

  await createSyncEvent(supabase, {
    channel: input.channel,
    direction: "inbound",
    payload: {
      action: "ical_import",
      importedEvents: newEvents.length,
      parsedEvents: parsedEvents.length,
      skippedDuplicates: parsedEvents.length - newEvents.length,
      sourceName: input.sourceName,
    },
    propertyId: input.propertyId,
    status: "synced",
  });

  return {
    imported: newEvents.length,
    parsed: parsedEvents.length,
    skipped: parsedEvents.length - newEvents.length,
  };
}
