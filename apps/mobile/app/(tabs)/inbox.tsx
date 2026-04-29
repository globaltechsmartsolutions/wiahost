import { Card, EmptyState, ListItem, SectionTitle } from "@/src/components/cards";
import { Screen } from "@/src/components/screen";
import { useMobileDashboard } from "@/src/hooks/use-mobile-dashboard";

export default function InboxScreen() {
  const { data, isLoading, refetch, isRefetching } = useMobileDashboard();
  const inbox = data?.inbox ?? [];

  return (
    <Screen
      isLoading={isLoading}
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
      subtitle="Mensajes entrantes priorizados por urgencia operativa y SLA."
      title="Inbox"
    >
      <Card>
        <SectionTitle helper="Bandeja unica para canales directos y OTAs.">
          Conversaciones
        </SectionTitle>
        {inbox.length ? (
          inbox.map((thread) => (
            <ListItem
              badge={thread.status}
              helper={`${thread.message} - ${thread.waiting}`}
              key={thread.id}
              meta={`${thread.property} - ${thread.channel}`}
              title={thread.guest}
            />
          ))
        ) : (
          <EmptyState title="Inbox limpio">
            No hay conversaciones pendientes.
          </EmptyState>
        )}
      </Card>
    </Screen>
  );
}
