import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  return Response.json({
    status: "ok",
    app: "wiahost",
    database: isSupabaseConfigured() ? "configured" : "not_configured",
  });
}
