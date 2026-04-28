export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(
    url &&
      anonKey &&
      !url.includes("replace_with") &&
      !anonKey.includes("replace_with") &&
      url.startsWith("http"),
  );
}

export function getSupabasePublicConfig() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Copy .env.example to apps/web/.env.local and set local keys.");
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}
