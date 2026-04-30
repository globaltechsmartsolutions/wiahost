import { reservationStatuses, type ReservationStatus } from "@wiahost/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  Card,
  EmptyState,
  OfflineBanner,
  SectionTitle,
  StatusBadge,
} from "@/src/components/cards";
import { Screen } from "@/src/components/screen";
import {
  StatusActionGroup,
  type StatusOption,
} from "@/src/components/status-actions";
import { useReservationDetail } from "@/src/hooks/use-reservation-detail";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { colors } from "@/src/lib/theme";
import { isGuid } from "@/src/lib/utils";

const statusLabels: Record<ReservationStatus, string> = {
  cancelled: "Cancelada",
  checked_in: "En estancia",
  checked_out: "Check-out",
  confirmed: "Confirmada",
  inquiry: "Consulta",
  no_show: "No show",
  pending: "Pendiente",
};

const statusOptions: StatusOption<ReservationStatus>[] =
  reservationStatuses.map((status) => ({
    label: statusLabels[status],
    value: status,
  }));

async function updateReservationStatus({
  reservationId,
  status,
}: {
  reservationId: string;
  status: ReservationStatus;
}) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Configura Supabase para actualizar reservas desde mobile.",
    );
  }

  if (!isGuid(reservationId)) {
    throw new Error(
      "Esta reserva demo es solo lectura. Con datos reales sera editable.",
    );
  }

  const { error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", reservationId);

  if (error) {
    throw error;
  }
}

function normalizeStatus(value: string): ReservationStatus {
  return reservationStatuses.includes(value as ReservationStatus)
    ? (value as ReservationStatus)
    : "pending";
}

export default function ReservationDetailScreen() {
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  const {
    data: reservation,
    isLoading,
    refetch,
    isRefetching,
  } = useReservationDetail(reservationId);
  const queryClient = useQueryClient();
  const [statusError, setStatusError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: updateReservationStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["reservation-detail", reservationId],
      });
      await queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
      await refetch();
    },
  });
  const currentStatus = reservation
    ? normalizeStatus(reservation.statusValue)
    : "pending";
  const canMutateReservation =
    Boolean(reservation) &&
    isSupabaseConfigured() &&
    isGuid(reservation?.id ?? "");

  const changeStatus = async (status: ReservationStatus) => {
    setStatusError(null);

    try {
      await mutation.mutateAsync({
        reservationId: reservationId ?? "",
        status,
      });
    } catch (error) {
      setStatusError(
        error instanceof Error
          ? error.message
          : "No hemos podido actualizar la reserva.",
      );
    }
  };

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
          {reservation.source === "cache" ? (
            <OfflineBanner cachedAt={reservation.cachedAt} />
          ) : null}
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
          <Card>
            <StatusActionGroup
              currentValue={currentStatus}
              disabled={!canMutateReservation}
              helper={
                canMutateReservation
                  ? "Actualiza check-in, check-out o cancelacion en segundos."
                  : "Solo lectura en modo demo. Conecta Supabase y abre una reserva real para guardar cambios."
              }
              onChange={changeStatus}
              options={statusOptions}
              pendingValue={
                mutation.isPending ? (mutation.variables?.status ?? null) : null
              }
              title="Estado de la reserva"
            />
            {statusError ? (
              <Text style={styles.error}>{statusError}</Text>
            ) : null}
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
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
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
