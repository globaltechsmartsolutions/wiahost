import { router } from "expo-router";

import { Card, EmptyState, ListItem, SectionTitle } from "@/src/components/cards";
import { PrimaryButton } from "@/src/components/form";
import { Screen } from "@/src/components/screen";
import { useMobileDashboard } from "@/src/hooks/use-mobile-dashboard";

export default function ReservationsScreen() {
  const { data, isLoading, refetch, isRefetching } = useMobileDashboard();
  const reservations = data?.reservations ?? [];

  return (
    <Screen
      isLoading={isLoading}
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
      subtitle="Reservas confirmadas, consultas y estancias para operar llegadas y salidas."
      title="Reservas"
      action={
        <PrimaryButton onPress={() => router.push("/reservations/new")}>
          Nueva
        </PrimaryButton>
      }
    >
      <Card>
        <SectionTitle helper="Ordenadas por entrada o actividad reciente.">
          Movimiento de reservas
        </SectionTitle>
        {reservations.length ? (
          reservations.map((reservation) => (
            <ListItem
              badge={reservation.status}
              helper={`${reservation.dates} - ${reservation.amount}`}
              key={reservation.id}
              meta={`${reservation.property} - ${reservation.channel}`}
              onPress={() =>
                router.push({
                  pathname: "/reservations/[reservationId]",
                  params: { reservationId: reservation.id },
                })
              }
              title={reservation.guest}
            />
          ))
        ) : (
          <EmptyState title="Sin reservas">No hay reservas visibles.</EmptyState>
        )}
      </Card>
    </Screen>
  );
}
