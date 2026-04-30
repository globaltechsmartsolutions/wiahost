import { incidentStatuses, type IncidentStatus } from "@wiahost/shared";
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
import { EvidenceUploader } from "@/src/components/evidence-uploader";
import { Screen } from "@/src/components/screen";
import {
  StatusActionGroup,
  type StatusOption,
} from "@/src/components/status-actions";
import { useIncidentDetail } from "@/src/hooks/use-incident-detail";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { colors } from "@/src/lib/theme";
import { isGuid } from "@/src/lib/utils";

const statusLabels: Record<IncidentStatus, string> = {
  cancelled: "Cancelada",
  charged: "Cobrada",
  investigating: "Investigando",
  open: "Abierta",
  resolved: "Resuelta",
};

const statusOptions: StatusOption<IncidentStatus>[] = incidentStatuses.map(
  (status) => ({
    label: statusLabels[status],
    value: status,
  }),
);

async function updateIncidentStatus({
  incidentId,
  status,
}: {
  incidentId: string;
  status: IncidentStatus;
}) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Configura Supabase para actualizar incidencias desde mobile.",
    );
  }

  if (!isGuid(incidentId)) {
    throw new Error(
      "Esta incidencia demo es solo lectura. Con datos reales sera editable.",
    );
  }

  const { error } = await supabase
    .from("incidents")
    .update({ status })
    .eq("id", incidentId);

  if (error) {
    throw error;
  }
}

function normalizeStatus(value: string): IncidentStatus {
  return incidentStatuses.includes(value as IncidentStatus)
    ? (value as IncidentStatus)
    : "open";
}

export default function IncidentDetailScreen() {
  const { incidentId } = useLocalSearchParams<{ incidentId: string }>();
  const {
    data: incident,
    isLoading,
    refetch,
    isRefetching,
  } = useIncidentDetail(incidentId);
  const queryClient = useQueryClient();
  const [statusError, setStatusError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: updateIncidentStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["incident-detail", incidentId],
      });
      await queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
      await refetch();
    },
  });
  const currentStatus = incident
    ? normalizeStatus(incident.statusValue)
    : "open";
  const canMutateIncident =
    Boolean(incident) && isSupabaseConfigured() && isGuid(incident?.id ?? "");

  const changeStatus = async (status: IncidentStatus) => {
    setStatusError(null);

    try {
      await mutation.mutateAsync({
        incidentId: incidentId ?? "",
        status,
      });
    } catch (error) {
      setStatusError(
        error instanceof Error
          ? error.message
          : "No hemos podido actualizar la incidencia.",
      );
    }
  };

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
          {incident.source === "cache" ? (
            <OfflineBanner cachedAt={incident.cachedAt} />
          ) : null}
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
          <Card>
            <StatusActionGroup
              currentValue={currentStatus}
              disabled={!canMutateIncident}
              helper={
                canMutateIncident
                  ? "Mantiene riesgo, tareas y panel web sincronizados."
                  : "Solo lectura en modo demo. Conecta Supabase y abre una incidencia real para guardar cambios."
              }
              onChange={changeStatus}
              options={statusOptions}
              pendingValue={
                mutation.isPending ? (mutation.variables?.status ?? null) : null
              }
              title="Estado de la incidencia"
            />
            {statusError ? (
              <Text style={styles.error}>{statusError}</Text>
            ) : null}
          </Card>
          <EvidenceUploader
            context={{
              incidentId: incident.id,
              label: incident.title,
              type: "incident",
            }}
            disabled={!canMutateIncident}
          />
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
