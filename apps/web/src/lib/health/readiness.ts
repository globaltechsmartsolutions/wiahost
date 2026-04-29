import { getSupabaseAdminClient } from "../supabase/admin";
import { isSupabaseConfigured } from "../supabase/config";
import { isStripeConfigured } from "../stripe/server";

export type ReadinessCheckStatus =
  | "error"
  | "not_configured"
  | "ok"
  | "skipped"
  | "warning";

export type ReadinessCheck = {
  key: string;
  label: string;
  message: string;
  status: ReadinessCheckStatus;
};

export type ReadinessSnapshot = {
  app: "wiahost";
  checkedAt: string;
  checks: ReadinessCheck[];
  database: ReadinessCheckStatus;
  status: "degraded" | "ok";
};

type ReadinessOptions = {
  checkDatabase?: boolean;
};

function isConfigured(value: string | undefined) {
  return Boolean(value && !/replace_with|your_|changeme|todo/i.test(value));
}

function createCheck(
  key: string,
  label: string,
  status: ReadinessCheckStatus,
  message: string,
): ReadinessCheck {
  return { key, label, message, status };
}

function resolveOverallStatus(checks: ReadinessCheck[]) {
  return checks.some((check) => check.status === "error") ? "degraded" : "ok";
}

export async function getReadinessSnapshot(
  options: ReadinessOptions = {},
): Promise<ReadinessSnapshot> {
  const checks: ReadinessCheck[] = [];
  const shouldCheckDatabase = options.checkDatabase ?? true;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  checks.push(
    createCheck(
      "app_url",
      "URL publica",
      appUrl?.startsWith("http") ? "ok" : "warning",
      appUrl?.startsWith("http")
        ? "La URL publica esta definida."
        : "Define NEXT_PUBLIC_APP_URL antes de produccion.",
    ),
  );

  checks.push(
    createCheck(
      "supabase_public",
      "Supabase publico",
      isSupabaseConfigured() ? "ok" : "warning",
      isSupabaseConfigured()
        ? "URL y anon key publicas configuradas."
        : "Faltan variables publicas de Supabase o siguen con placeholder.",
    ),
  );

  checks.push(
    createCheck(
      "supabase_service_role",
      "Supabase service role",
      isConfigured(supabaseServiceRoleKey) ? "ok" : "warning",
      isConfigured(supabaseServiceRoleKey)
        ? "Service role disponible solo en servidor."
        : "Necesario para tareas server-only y checks de base de datos.",
    ),
  );

  let databaseStatus: ReadinessCheckStatus = "skipped";

  if (!shouldCheckDatabase) {
    checks.push(
      createCheck(
        "database",
        "Base de datos",
        "skipped",
        "Check omitido para mantener la prueba rapida.",
      ),
    );
  } else if (!isSupabaseConfigured() || !isConfigured(supabaseServiceRoleKey)) {
    databaseStatus = "not_configured";
    checks.push(
      createCheck(
        "database",
        "Base de datos",
        databaseStatus,
        "No se puede verificar la base de datos sin Supabase y service role.",
      ),
    );
  } else {
    try {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true });

      databaseStatus = error ? "error" : "ok";
      checks.push(
        createCheck(
          "database",
          "Base de datos",
          databaseStatus,
          error
            ? "Supabase responde con error al consultar properties."
            : "Consulta server-side a Supabase correcta.",
        ),
      );
    } catch {
      databaseStatus = "error";
      checks.push(
        createCheck(
          "database",
          "Base de datos",
          databaseStatus,
          "No se pudo completar la consulta server-side a Supabase.",
        ),
      );
    }
  }

  const stripeReady = isStripeConfigured();
  checks.push(
    createCheck(
      "stripe_checkout",
      "Stripe Checkout",
      stripeReady
        ? isConfigured(stripeWebhookSecret)
          ? "ok"
          : "warning"
        : "not_configured",
      stripeReady
        ? isConfigured(stripeWebhookSecret)
          ? "Stripe y webhook firmado configurados."
          : "STRIPE_SECRET_KEY existe, pero falta STRIPE_WEBHOOK_SECRET."
        : "Checkout demo activo; Stripe real queda opcional hasta configurar claves.",
    ),
  );

  return {
    app: "wiahost",
    checkedAt: new Date().toISOString(),
    checks,
    database: databaseStatus,
    status: resolveOverallStatus(checks),
  };
}
