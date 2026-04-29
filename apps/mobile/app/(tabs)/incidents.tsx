import { router } from "expo-router";

import { Card, EmptyState, ListItem, SectionTitle } from "@/src/components/cards";
import { PrimaryButton } from "@/src/components/form";
import { Screen } from "@/src/components/screen";
import {
  type MobileQueueItem,
  useMobileDashboard,
} from "@/src/hooks/use-mobile-dashboard";

function openQueueItem(item: MobileQueueItem) {
  if (item.entityType === "inbox") {
    router.push({
      pathname: "/inbox/[conversationId]",
      params: { conversationId: item.id },
    });
    return;
  }

  if (item.entityType === "task") {
    router.push({
      pathname: "/tasks/[taskId]",
      params: { taskId: item.id },
    });
    return;
  }

  router.push({
    pathname: "/incidents/[incidentId]",
    params: { incidentId: item.id },
  });
}

export default function IncidentsScreen() {
  const { data, isLoading, refetch, isRefetching } = useMobileDashboard();
  const incidents = data?.incidents ?? [];
  const queue = data?.queue ?? [];

  return (
    <Screen
      isLoading={isLoading}
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
      subtitle="Riesgos, tareas criticas e incidencias para proteger activos y ratings."
      title="Riesgo"
      action={
        <PrimaryButton onPress={() => router.push("/incidents/new")}>
          Nueva
        </PrimaryButton>
      }
    >
      <Card>
        <SectionTitle helper="Acciones que conviene cerrar antes de que escalen.">
          Tareas criticas
        </SectionTitle>
        <PrimaryButton
          onPress={() => router.push("/tasks/new")}
          variant="secondary"
        >
          Nueva tarea
        </PrimaryButton>
        {queue.length ? (
          queue.map((item) => (
            <ListItem
              badge={item.priority}
              helper={item.entityType === "task" ? "Tarea operativa" : "Inbox"}
              key={`${item.entityType}-${item.id}`}
              meta={item.meta}
              onPress={() => openQueueItem(item)}
              title={item.label}
            />
          ))
        ) : (
          <EmptyState title="Sin tareas criticas">
            La cola prioritaria esta controlada.
          </EmptyState>
        )}
      </Card>

      <Card>
        <SectionTitle helper="Seguimiento de coste, severidad y estado.">
          Incidencias
        </SectionTitle>
        {incidents.length ? (
          incidents.map((incident) => (
            <ListItem
              badge={incident.severity}
              helper={`${incident.status} - ${incident.cost}`}
              key={incident.id}
              meta={incident.property}
              onPress={() =>
                router.push({
                  pathname: "/incidents/[incidentId]",
                  params: { incidentId: incident.id },
                })
              }
              title={incident.title}
            />
          ))
        ) : (
          <EmptyState title="Sin incidencias">No hay incidencias abiertas.</EmptyState>
        )}
      </Card>
    </Screen>
  );
}
