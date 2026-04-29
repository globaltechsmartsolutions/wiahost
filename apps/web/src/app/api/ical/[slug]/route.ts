import { NextResponse } from "next/server";

import { getAvailabilityCalendarFeed } from "@/lib/data/ical";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const host = new URL(request.url).host;
  const feed = await getAvailabilityCalendarFeed(slug, host);

  if (!feed) {
    return new NextResponse("Calendar feed not found", { status: 404 });
  }

  return new NextResponse(feed.body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="${feed.filename}"`,
      "Content-Type": "text/calendar; charset=utf-8",
    },
  });
}
