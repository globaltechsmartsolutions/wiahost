import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Card, EmptyState, SectionTitle, StatusBadge } from "@/src/components/cards";
import { Screen } from "@/src/components/screen";
import { useMobileDashboard } from "@/src/hooks/use-mobile-dashboard";
import { colors } from "@/src/lib/theme";

export default function IncidentDetailScreen() {
  const { incidentId } = useLocalSearchParams<{ incidentId: string }>();
  const { data, isLoading, refetch, isRefetching } = useMobileDashboard();
  const incident = data?.incidents.find((item) => item.id === incidentId);

  return (
    <Screen
      isLoading={isLoading}
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
      subtitle="Seguimiento rapido para decidir si escalar, cobrar o cerrar."
      title={incident?.title ?? "Incidencia"}
    >
      {incident ? (
        <>
          <Card>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{incident.title}</Text>
                <Text style={styles.meta}>{incident.property}</Text>
              </View>
              <StatusBadge label={incident.severity} />
            </View>
          </Card>
          <Card>
            <SectionTitle helper="Estado de seguimiento operativo.">
              Detalle
            </SectionTitle>
            <DetailRow label="Estado" value={incident.status} />
            <DetailRow label="Severidad" value={incident.severity} />
            <DetailRow label="Coste" value={incident.cost} />
          </Card>
        </>
      ) : (
        <EmptyState title="Incidencia no encontrada">
          No hemos encontrado esta incidencia en la cache movil.
        </EmptyState>
      )}
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  detailRow: {
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 13,
  },
  detailValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
});
