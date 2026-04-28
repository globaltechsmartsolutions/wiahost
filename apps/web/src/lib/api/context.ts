import type { createSupabaseServerClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/responses";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type ApiContext =
  | { ok: true; supabase: SupabaseServerClient; userId: string }
  | { ok: false; response: Response };

export async function getAuthenticatedApiContext(): Promise<ApiContext> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      response: apiError("supabase_not_configured", "Supabase no esta configurado para guardar cambios.", 503),
    };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return {
      ok: false,
      response: apiError("unauthorized", "Debes iniciar sesion.", 401),
    };
  }

  return { ok: true, supabase, userId: userData.user.id };
}

export async function parseJsonBody(request: Request) {
  try {
    return { ok: true as const, body: await request.json() };
  } catch {
    return {
      ok: false as const,
      response: apiError("invalid_json", "El cuerpo de la peticion no es JSON valido.", 400),
    };
  }
}
