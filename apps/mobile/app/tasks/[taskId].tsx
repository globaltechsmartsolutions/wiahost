import { taskStatuses, type TaskStatus } from "@wiahost/shared";
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
import { useTaskDetail } from "@/src/hooks/use-task-detail";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { colors } from "@/src/lib/theme";
import { isGuid } from "@/src/lib/utils";

const statusLabels: Record<TaskStatus, string> = {
  blocked: "Bloqueada",
  cancelled: "Cancelada",
  done: "Cerrada",
  in_progress: "En curso",
  open: "Abierta",
  scheduled: "Programada",
};

const statusOptions: StatusOption<TaskStatus>[] = taskStatuses.map(
  (status) => ({
    label: statusLabels[status],
    value: status,
  }),
);

async function updateTaskStatus({
  status,
  taskId,
}: {
  status: TaskStatus;
  taskId: string;
}) {
  if (!isSupabaseConfigured()) {
    throw new Error("Configura Supabase para actualizar tareas desde mobile.");
  }

  if (!isGuid(taskId)) {
    throw new Error(
      "Esta tarea demo es solo lectura. Con datos reales sera editable.",
    );
  }

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId);

  if (error) {
    throw error;
  }
}

function normalizeStatus(value: string): TaskStatus {
  return taskStatuses.includes(value as TaskStatus)
    ? (value as TaskStatus)
    : "open";
}

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const {
    data: task,
    isLoading,
    refetch,
    isRefetching,
  } = useTaskDetail(taskId);
  const queryClient = useQueryClient();
  const [statusError, setStatusError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: updateTaskStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["task-detail", taskId],
      });
      await queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
      await refetch();
    },
  });
  const currentStatus = task ? normalizeStatus(task.statusValue) : "open";
  const canMutateTask =
    Boolean(task) && isSupabaseConfigured() && isGuid(task?.id ?? "");

  const changeStatus = async (status: TaskStatus) => {
    setStatusError(null);

    try {
      await mutation.mutateAsync({
        status,
        taskId: taskId ?? "",
      });
    } catch (error) {
      setStatusError(
        error instanceof Error
          ? error.message
          : "No hemos podido actualizar la tarea.",
      );
    }
  };

  return (
    <Screen
      isLoading={isLoading}
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
      subtitle="Accion operativa con prioridad, fecha y estado accionable."
      title={task?.title ?? "Tarea"}
    >
      {task ? (
        <>
          {task.source === "cache" ? (
            <OfflineBanner cachedAt={task.cachedAt} />
          ) : null}
          <Card>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{task.title}</Text>
                <Text style={styles.meta}>{task.property}</Text>
              </View>
              <StatusBadge label={task.priority} />
            </View>
          </Card>

          <Card>
            <SectionTitle helper="Contexto para resolverla sin abrir el panel web.">
              Detalle
            </SectionTitle>
            <DetailRow label="Tipo" value={task.type} />
            <DetailRow label="Vencimiento" value={task.due} />
            <DetailRow label="Estado" value={task.status} />
            <DetailRow label="Descripcion" value={task.description} />
          </Card>

          <Card>
            <StatusActionGroup
              currentValue={currentStatus}
              disabled={!canMutateTask}
              helper={
                canMutateTask
                  ? "Cambia el estado y actualiza la cola operativa."
                  : "Solo lectura en modo demo. Conecta Supabase y abre una tarea real para guardar cambios."
              }
              onChange={changeStatus}
              options={statusOptions}
              pendingValue={
                mutation.isPending ? (mutation.variables?.status ?? null) : null
              }
              title="Estado de la tarea"
            />
            {statusError ? (
              <Text style={styles.error}>{statusError}</Text>
            ) : null}
          </Card>
          <EvidenceUploader
            context={{
              label: task.title,
              propertyId: task.propertyId,
              reservationId: task.reservationId,
              taskId: task.id,
              type: "task",
            }}
            disabled={!canMutateTask}
          />
        </>
      ) : (
        <EmptyState title="Tarea no encontrada">
          No hemos encontrado esta tarea en la cache movil.
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
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
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
