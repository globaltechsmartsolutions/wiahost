import { NextResponse } from "next/server";

import { getAuthenticatedApiContext } from "@/lib/api/context";
import { getInboxThreads } from "@/lib/data/operations";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const threads = await getInboxThreads();
  return NextResponse.json({ data: threads });
}
