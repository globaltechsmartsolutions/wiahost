import { addDays, format } from "date-fns";

import { getPublicBookingListing } from "@/lib/data/direct-booking";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ReservationBusyRow = {
  check_in: string;
  check_out: string;
  id: string;
  status: string;
  updated_at: string | null;
};

type CalendarBlockBusyRow = {
  end_date: string;
  id: string;
  reason: string | null;
  start_date: string;
};

type CalendarEvent = {
  description: string;
  endDate: string;
  id: string;
  startDate: string;
  summary: string;
  updatedAt?: string | null;
};

type CalendarFeed = {
  body: string;
  filename: string;
};

const fallbackToday = new Date();

function escapeIcsText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function dateToIcs(value: string | Date) {
  return format(new Date(value), "yyyyMMdd");
}

function timestampToIcs(value: string | Date) {
  const date = new Date(value);
  const parts = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
    "T",
    String(date.getUTCHours()).padStart(2, "0"),
    String(date.getUTCMinutes()).padStart(2, "0"),
    String(date.getUTCSeconds()).padStart(2, "0"),
    "Z",
  ];

  return parts.join("");
}

function eventToIcs(event: CalendarEvent, host: string) {
  const updatedAt = event.updatedAt ?? new Date().toISOString();

  return [
    "BEGIN:VEVENT",
    `UID:${event.id}@${host}`,
    `DTSTAMP:${timestampToIcs(updatedAt)}`,
    `DTSTART;VALUE=DATE:${dateToIcs(event.startDate)}`,
    `DTEND;VALUE=DATE:${dateToIcs(event.endDate)}`,
    `SUMMARY:${escapeIcsText(event.summary)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    "TRANSP:OPAQUE",
    "END:VEVENT",
  ];
}

function buildCalendar({
  events,
  host,
  name,
}: {
  events: CalendarEvent[];
  host: string;
  name: string;
}) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WIAHost//Availability Calendar//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(name)}`,
    `X-WR-TIMEZONE:Europe/Madrid`,
    ...events.flatMap((event) => eventToIcs(event, host)),
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function fallbackCalendar(slug: string, host: string): CalendarFeed | null {
  if (slug !== "loft-malaga-centro") {
    return null;
  }

  const startDate = addDays(fallbackToday, 14);
  const endDate = addDays(fallbackToday, 17);
  const name = "Loft Malaga Centro - WIAHost";

  return {
    body: buildCalendar({
      events: [
        {
          description: "Bloque demo sin datos personales.",
          endDate: endDate.toISOString(),
          id: "demo-direct-calendar-block",
          startDate: startDate.toISOString(),
          summary: "Reservado",
        },
      ],
      host,
      name,
    }),
    filename: `${slug}.ics`,
  };
}

export async function getAvailabilityCalendarFeed(
  slug: string,
  host = "wiahost.local",
): Promise<CalendarFeed | null> {
  if (!isSupabaseConfigured()) {
    return fallbackCalendar(slug, host);
  }

  const listing = await getPublicBookingListing(slug);

  if (!listing) {
    return null;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const [{ data: reservations }, { data: blocks }] = await Promise.all([
      supabase
        .from("reservations")
        .select("id,status,check_in,check_out,updated_at")
        .eq("property_id", listing.propertyId)
        .in("status", ["pending", "confirmed", "checked_in"])
        .order("check_in", { ascending: true }),
      supabase
        .from("calendar_blocks")
        .select("id,start_date,end_date,reason")
        .eq("property_id", listing.propertyId)
        .order("start_date", { ascending: true }),
    ]);

    const reservationEvents = (
      (reservations ?? []) as ReservationBusyRow[]
    ).map((reservation) => ({
      description: "Reserva gestionada por WIAHost. Datos personales ocultos.",
      endDate: reservation.check_out,
      id: `reservation-${reservation.id}`,
      startDate: reservation.check_in,
      summary: "Reservado",
      updatedAt: reservation.updated_at,
    }));

    const blockEvents = ((blocks ?? []) as CalendarBlockBusyRow[]).map(
      (block) => ({
        description: "Bloque operativo gestionado por WIAHost.",
        endDate: block.end_date,
        id: `block-${block.id}`,
        startDate: block.start_date,
        summary: block.reason ?? "Bloqueado",
      }),
    );

    return {
      body: buildCalendar({
        events: [...reservationEvents, ...blockEvents],
        host,
        name: `${listing.propertyName} - WIAHost`,
      }),
      filename: `${slug}.ics`,
    };
  } catch {
    return fallbackCalendar(slug, host);
  }
}
