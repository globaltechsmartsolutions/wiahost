import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Card, EmptyState, SectionTitle, StatusBadge } from "@/src/components/cards";
import { Screen } from "@/src/components/screen";
import { useMobileDashboard } from "@/src/hooks/use-mobile-dashboard";
import { colors } from "@/src/lib/theme";

export default function InboxDetailScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { data, isLoading, refetch, isRefetching } = useMobileDashboard();
  const thread = data?.inbox.find((item) => item.id === conversationId);

  return (
    <Screen
      isLoading={isLoading}
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
      subtitle="Mensaje priorizado para responder sin perder contexto."
      title={thread?.guest ?? "Conversacion"}
    >
      {thread ? (
        <>
          <Card>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{thread.guest}</Text>
                <Text style={styles.meta}>
                  {thread.property} - {thread.channel}
                </Text>
              </View>
              <StatusBadge label={thread.status} />
            </View>
          </Card>
          <Card>
            <SectionTitle helper={`Tiempo visible: ${thread.waiting}`}>
              Ultimo mensaje
            </SectionTitle>
            <Text style={styles.message}>{thread.message}</Text>
          </Card>
        </>
      ) : (
        <EmptyState title="Conversacion no encontrada">
          No hemos encontrado este hilo en la cache movil.
        </EmptyState>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  message: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
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
