import { NextResponse } from "next/server";

import { getAuthenticatedApiContext } from "@/lib/api/context";
import { getDirectLeads } from "@/lib/data/leads";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const leads = await getDirectLeads();
  return NextResponse.json({ data: leads });
}
