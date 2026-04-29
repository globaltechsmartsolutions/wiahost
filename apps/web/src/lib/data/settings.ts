import { getReadinessSnapshot } from "@/lib/health/readiness";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SettingsIntegration = {
  description: string;
  label: string;
  status: string;
};

export type SettingsSystemHealth = {
  description: string;
  label: string;
  status: string;
};

export type SettingsProfile = {
  email: string;
  fullName: string;
  phone: string;
  role: string;
};

export type SettingsData = {
  integrations: SettingsIntegration[];
  profile: SettingsProfile;
  systemHealth: SettingsSystemHealth[];
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  housekeeping: "Limpieza",
  maintenance: "Mantenimiento",
  operator: "Operaciones",
  owner: "Propietario",
};

const fallbackData: SettingsData = {
  integrations: [
    {
      description: "Auth, Postgres, RLS y Storage preparados para local.",
      label: "Supabase",
      status: "Demo",
    },
    {
      description: "Canales preparados: Airbnb, Booking, Vrbo, Expedia.",
      label: "Channel manager",
      status: "Pendiente",
    },
    {
      description: "Pagos futuros con Stripe/Redsys y conciliacion manual.",
      label: "Pagos",
      status: "Pendiente",
    },
    {
      description: "Check-in, checkout, limpieza y mensajes recurrentes.",
      label: "Automatizaciones",
      status: "Preparado",
    },
  ],
  profile: {
    email: "operaciones@wiahost.local",
    fullName: "Laura Operaciones",
    phone: "",
    role: "Operaciones",
  },
  systemHealth: [
    {
      description: "Configura apps/web/.env.local para conectar Supabase.",
      label: "Supabase",
      status: "Aviso",
    },
    {
      description: "Checkout demo activo hasta configurar Stripe real.",
      label: "Stripe Checkout",
      status: "Aviso",
    },
  ],
};

function labelReadinessStatus(status: string) {
  if (status === "ok") {
    return "OK";
  }

  if (status === "error") {
    return "Error";
  }

  return "Aviso";
}

async function getSystemHealth(): Promise<SettingsSystemHealth[]> {
  const snapshot = await getReadinessSnapshot();

  return snapshot.checks.map((check) => ({
    description: check.message,
    label: check.label,
    status: labelReadinessStatus(check.status),
  }));
}

function labelRole(role: string | null | undefined) {
  if (!role) {
    return "Sin rol";
  }

  return roleLabels[role] ?? role;
}

export async function getSettingsData(): Promise<SettingsData> {
  if (!isSupabaseConfigured()) {
    return fallbackData;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      return fallbackData;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name,role,phone")
      .eq("id", userData.user.id)
      .single();

    const systemHealth = await getSystemHealth();

    return {
      integrations: [
        {
          description: "Auth, Postgres, RLS, Realtime y Storage disponibles.",
          label: "Supabase local",
          status: "Activo",
        },
        {
          description: "Airbnb, Booking, Vrbo, Expedia y web directa.",
          label: "Canales",
          status: "Preparado",
        },
        {
          description: "Plantillas para check-in, checkout, limpieza e inbox.",
          label: "Automatizaciones",
          status: "Preparado",
        },
        {
          description:
            "Stripe/Redsys y liquidaciones de propietario en roadmap.",
          label: "Pagos",
          status: "Pendiente",
        },
        {
          description: "Fotos, documentos, evidencias e incidencias.",
          label: "Storage",
          status: "Activo",
        },
        {
          description:
            "Roles admin, operaciones, propietario, limpieza y mantenimiento.",
          label: "Permisos",
          status: "Activo",
        },
      ],
      profile: {
        email: userData.user.email ?? "Sin email",
        fullName: profile?.full_name ?? "Usuario WIAHost",
        phone: profile?.phone ?? "",
        role: labelRole(profile?.role),
      },
      systemHealth,
    };
  } catch {
    return fallbackData;
  }
}
