import { zodResolver } from "@hookform/resolvers/zod";
import {
  severities,
  taskSchema,
  type Severity,
  type TaskInput,
  type TaskType,
} from "@wiahost/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

import { Card, EmptyState, SectionTitle } from "@/src/components/cards";
import { Field, PrimaryButton, SelectPill } from "@/src/components/form";
import { Screen } from "@/src/components/screen";
import { useMobileDashboard } from "@/src/hooks/use-mobile-dashboard";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { colors } from "@/src/lib/theme";
import { isGuid } from "@/src/lib/utils";

const taskTypes: TaskType[] = [
  "cleaning",
  "maintenance",
  "inspection",
  "guest_request",
  "admin",
];

const taskTypeLabels: Record<TaskType, string> = {
  admin: "Admin",
  cleaning: "Limpieza",
  guest_request: "Huesped",
  inspection: "Inspeccion",
  maintenance: "Mantenimiento",
};

const severityLabels: Record<Severity, string> = {
  critical: "Critica",
  high: "Alta",
  low: "Baja",
  medium: "Media",
};

function defaultDueAt() {
  const date = new Date();
  date.setHours(date.getHours() + 3, 0, 0, 0);
  return date.toISOString().slice(0, 16);
}

async function createTask(input: TaskInput) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Configura Supabase en apps/mobile/.env para crear tareas.",
    );
  }

  const { error } = await supabase.from("tasks").insert({
    description: input.description ?? null,
    due_at: input.dueAt ? new Date(input.dueAt).toISOString() : null,
    priority: input.priority,
    property_id: input.propertyId,
    reservation_id: input.reservationId ?? null,
    status: input.status,
    title: input.title,
    type: input.type,
  });

  if (error) {
    throw error;
  }
}

export default function NewTaskScreen() {
  const queryClient = useQueryClient();
  const { data } = useMobileDashboard();
  const [formError, setFormError] = useState<string | null>(null);
  const dueAt = useMemo(defaultDueAt, []);
  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    watch,
  } = useForm<TaskInput>({
    defaultValues: {
      description: "",
      dueAt,
      priority: "medium",
      propertyId: "",
      reservationId: undefined,
      status: "open",
      title: "",
      type: "cleaning",
    },
    resolver: zodResolver(taskSchema) as Resolver<TaskInput>,
  });
  const selectedPriority = watch("priority");
  const selectedPropertyId = watch("propertyId");
  const selectedType = watch("type");
  const propertyOptions = (data?.properties ?? []).filter((property) =>
    isGuid(property.id),
  );
  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
      router.replace("/incidents");
    },
  });

  useEffect(() => {
    const firstProperty = propertyOptions[0];
    if (!selectedPropertyId && firstProperty) {
      setValue("propertyId", firstProperty.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [propertyOptions, selectedPropertyId, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No hemos podido crear la tarea.",
      );
    }
  });

  return (
    <Screen
      subtitle="Crea una tarea para limpieza, mantenimiento, inspeccion o peticion de huesped."
      title="Nueva tarea"
    >
      {!isSupabaseConfigured() ? (
        <EmptyState title="Conecta Supabase">
          La creacion real de tareas necesita `apps/mobile/.env`. En modo demo
          solo mostramos datos.
        </EmptyState>
      ) : (
        <>
          <Card>
            <SectionTitle helper="Activo donde se realizara la tarea.">
              Propiedad
            </SectionTitle>
            {propertyOptions.length ? (
              <View style={styles.pillGrid}>
                {propertyOptions.map((property) => (
                  <SelectPill
                    active={selectedPropertyId === property.id}
                    key={property.id}
                    onPress={() =>
                      setValue("propertyId", property.id, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    {property.name}
                  </SelectPill>
                ))}
              </View>
            ) : (
              <Text style={styles.meta}>
                No hay activos reales disponibles para seleccionar. Crea uno
                desde Activos.
              </Text>
            )}
            {errors.propertyId?.message ? (
              <Text style={styles.error}>{errors.propertyId.message}</Text>
            ) : null}
          </Card>

          <Card>
            <SectionTitle helper="Describe que tiene que pasar y cuando.">
              Detalle
            </SectionTitle>
            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <Field
                  error={errors.title?.message}
                  label="Titulo"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Preparar Atico Gran Via"
                  testID="task-title"
                  value={field.value}
                />
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Field
                  error={errors.description?.message}
                  label="Descripcion"
                  multiline
                  numberOfLines={4}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Checklist, contexto y notas para el equipo."
                  style={styles.textarea}
                  testID="task-description"
                  value={field.value}
                />
              )}
            />
            <Controller
              control={control}
              name="dueAt"
              render={({ field }) => (
                <Field
                  error={errors.dueAt?.message}
                  label="Vencimiento"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="2026-05-01T13:00"
                  value={field.value}
                />
              )}
            />
            <View style={styles.statusBlock}>
              <SectionTitle helper="Tipo de trabajo.">Tipo</SectionTitle>
              <View style={styles.pillGrid}>
                {taskTypes.map((type) => (
                  <SelectPill
                    active={selectedType === type}
                    key={type}
                    onPress={() =>
                      setValue("type", type, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    {taskTypeLabels[type]}
                  </SelectPill>
                ))}
              </View>
            </View>
            <View style={styles.statusBlock}>
              <SectionTitle helper="Impacta en la cola prioritaria.">
                Prioridad
              </SectionTitle>
              <View style={styles.pillGrid}>
                {severities.map((severity) => (
                  <SelectPill
                    active={selectedPriority === severity}
                    key={severity}
                    onPress={() =>
                      setValue("priority", severity, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    {severityLabels[severity]}
                  </SelectPill>
                ))}
              </View>
            </View>
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            <PrimaryButton disabled={mutation.isPending} onPress={onSubmit}>
              {mutation.isPending ? "Creando..." : "Crear tarea"}
            </PrimaryButton>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  pillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusBlock: {
    gap: 10,
  },
  textarea: {
    minHeight: 112,
    paddingTop: 14,
    textAlignVertical: "top",
  },
});
