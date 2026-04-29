import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Card, EmptyState, SectionTitle, StatusBadge } from "@/src/components/cards";
import { Screen } from "@/src/components/screen";
import { useMobileDashboard } from "@/src/hooks/use-mobile-dashboard";
import { colors } from "@/src/lib/theme";

export default function ReservationDetailScreen() {
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  const { data, isLoading, refetch, isRefetching } = useMobileDashboard();
  const reservation = data?.reservations.find((item) => item.id === reservationId);

  return (
    <Screen
      isLoading={isLoading}
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
      subtitle="Resumen para coordinar llegada, canal e importe desde el movil."
      title={reservation?.guest ?? "Reserva"}
    >
      {reservation ? (
        <>
          <Card>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{reservation.guest}</Text>
                <Text style={styles.meta}>{reservation.property}</Text>
              </View>
              <StatusBadge label={reservation.status} />
            </View>
          </Card>
          <Card>
            <SectionTitle helper="Contexto operativo de la reserva.">
              Detalle
            </SectionTitle>
            <DetailRow label="Fechas" value={reservation.dates} />
            <DetailRow label="Canal" value={reservation.channel} />
            <DetailRow label="Importe" value={reservation.amount} />
            <DetailRow label="Estado" value={reservation.status} />
          </Card>
        </>
      ) : (
        <EmptyState title="Reserva no encontrada">
          No hemos encontrado esta reserva en la cache movil.
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
