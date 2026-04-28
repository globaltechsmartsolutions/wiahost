export async function GET() {
  return Response.json({
    status: "ok",
    app: "wiahost",
    database: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "not_configured",
  });
}
