import { router } from "expo-router";
import { Radio } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Card, ListItem, SectionTitle, StatCard } from "@/src/components/cards";
import { PrimaryButton } from "@/src/components/form";
import { Screen } from "@/src/components/screen";
import { useAuth } from "@/src/features/auth/auth-provider";
import { isSupabaseConfigured } from "@/src/lib/supabase";
import { colors } from "@/src/lib/theme";
import { useMobileDashboard } from "@/src/hooks/use-mobile-dashboard";

function cachedAtLabel(value: string | undefined) {
  if (!value) {
    return "ultima sincronizacion disponible";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export default function DashboardScreen() {
  const { profile, session } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useMobileDashboard();
  const showDemoBanner = !isSupabaseConfigured() || !session;

  return (
    <Screen
      isLoading={isLoading}
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
      subtitle="Vista movil para operar reservas, mensajes, tareas e incidencias sin abrir el portatil."
      title={`Hola${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
    >
      <View style={styles.hero}>
        <View style={styles.livePill}>
          <Radio color={colors.lime} size={15} />
          <Text style={styles.livePillText}>Centro de mando movil</Text>
        </View>
        <Text style={styles.heroTitle}>Lo urgente primero. Lo demas, ordenado.</Text>
        <Text style={styles.heroText}>
          Prioriza check-ins, mensajes, limpiezas y riesgos con el mismo backend que la web.
        </Text>
      </View>

      {showDemoBanner ? (
        <Card>
          <Text style={styles.bannerTitle}>Modo demo activo</Text>
          <Text style={styles.bannerText}>
            Copia `apps/mobile/.env.example` a `apps/mobile/.env` para conectar Supabase local. Mientras tanto puedes revisar la experiencia movil.
          </Text>
          <View style={styles.buttonRow}>
            <PrimaryButton onPress={() => router.push("/login")}>Entrar</PrimaryButton>
            <PrimaryButton
              onPress={() => router.push("/register")}
              variant="secondary"
            >
              Crear cuenta
            </PrimaryButton>
          </View>
        </Card>
      ) : null}

      {data?.source === "cache" ? (
        <Card>
          <Text style={styles.bannerTitle}>Modo offline read-only</Text>
          <Text style={styles.bannerText}>
            Mostrando la ultima operativa guardada en este movil:{" "}
            {cachedAtLabel(data.cachedAt)}. Tira para refrescar cuando vuelva la
            conexion.
          </Text>
        </Card>
      ) : null}

      <View style={styles.metricsGrid}>
        {(data?.metrics ?? []).map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </View>

      <Card>
        <SectionTitle helper="Siguiente mejor accion para operaciones.">
          Cola prioritaria
        </SectionTitle>
        {(data?.queue ?? []).map((item) => (
          <ListItem
            badge={item.priority}
            key={`${item.label}-${item.meta}`}
            meta={item.meta}
            title={item.label}
          />
        ))}
      </Card>

      <Card>
        <SectionTitle helper="Proximas reservas y entradas visibles.">
          Reservas que mueven la operacion
        </SectionTitle>
        {(data?.reservations ?? []).slice(0, 4).map((reservation) => (
          <ListItem
            badge={reservation.status}
            helper={`${reservation.dates} - ${reservation.amount}`}
            key={reservation.id}
            meta={`${reservation.property} - ${reservation.channel}`}
            title={reservation.guest}
          />
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bannerText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  bannerTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  hero: {
    backgroundColor: colors.panel,
    borderRadius: 28,
    gap: 13,
    overflow: "hidden",
    padding: 20,
  },
  heroText: {
    color: "#d6ccbe",
    fontSize: 14,
    lineHeight: 20,
  },
  heroTitle: {
    color: "#fffdf8",
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -1.3,
    lineHeight: 34,
  },
  livePill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  livePillText: {
    color: "#fffdf8",
    fontSize: 13,
    fontWeight: "800",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
