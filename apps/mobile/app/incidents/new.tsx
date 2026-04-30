import { zodResolver } from "@hookform/resolvers/zod";
import {
  incidentSchema,
  severities,
  type IncidentInput,
  type Severity,
} from "@wiahost/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

import { Card, EmptyState, SectionTitle } from "@/src/components/cards";
import { Field, PrimaryButton, SelectPill } from "@/src/components/form";
import { Screen } from "@/src/components/screen";
import { useMobileDashboard } from "@/src/hooks/use-mobile-dashboard";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { colors } from "@/src/lib/theme";
import { isGuid } from "@/src/lib/utils";

const severityLabels: Record<Severity, string> = {
  critical: "Critica",
  high: "Alta",
  low: "Baja",
  medium: "Media",
};

async function createIncident(input: IncidentInput) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Configura Supabase en apps/mobile/.env para crear incidencias.",
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("incidents").insert({
    description: input.description,
    estimated_cost: input.estimatedCost ?? null,
    property_id: input.propertyId,
    reported_by: user?.id ?? null,
    reservation_id: input.reservationId ?? null,
    severity: input.severity,
    status: input.status,
    title: input.title,
  });

  if (error) {
    throw error;
  }
}

export default function NewIncidentScreen() {
  const queryClient = useQueryClient();
  const { data } = useMobileDashboard();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    watch,
  } = useForm<IncidentInput>({
    defaultValues: {
      description: "",
      estimatedCost: undefined,
      propertyId: "",
      reservationId: undefined,
      severity: "medium",
      status: "open",
      title: "",
    },
    resolver: zodResolver(incidentSchema) as Resolver<IncidentInput>,
  });
  const selectedPropertyId = watch("propertyId");
  const propertyOptions = (data?.properties ?? []).filter((property) =>
    isGuid(property.id),
  );
  const selectedSeverity = watch("severity");
  const mutation = useMutation({
    mutationFn: createIncident,
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
          : "No hemos podido crear la incidencia.",
      );
    }
  });

  return (
    <Screen
      subtitle="Registra una incidencia en campo y dejala visible para operaciones."
      title="Nueva incidencia"
    >
      {!isSupabaseConfigured() ? (
        <EmptyState title="Conecta Supabase">
          La creacion real de incidencias necesita `apps/mobile/.env`. En modo
          demo solo mostramos datos.
        </EmptyState>
      ) : (
        <>
          <Card>
            <SectionTitle helper="Selecciona el activo afectado.">
              Activo
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
            <SectionTitle helper="Cuanto mejor el contexto, mas rapido se resuelve.">
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
                  placeholder="Caldera con presion irregular"
                  testID="incident-title"
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
                  placeholder="Describe que pasa, donde y si bloquea la operacion."
                  style={styles.textarea}
                  testID="incident-description"
                  value={field.value}
                />
              )}
            />
            <Controller
              control={control}
              name="estimatedCost"
              render={({ field }) => (
                <Field
                  error={errors.estimatedCost?.message}
                  keyboardType="numeric"
                  label="Coste estimado"
                  onBlur={field.onBlur}
                  onChangeText={(value) =>
                    field.onChange(value ? Number(value) || 0 : undefined)
                  }
                  placeholder="90"
                  value={field.value === undefined ? "" : String(field.value)}
                />
              )}
            />
            <View style={styles.statusBlock}>
              <SectionTitle helper="Ayuda a ordenar la cola de operaciones.">
                Severidad
              </SectionTitle>
              <View style={styles.pillGrid}>
                {severities.map((severity) => (
                  <SelectPill
                    active={selectedSeverity === severity}
                    key={severity}
                    onPress={() =>
                      setValue("severity", severity, {
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
              {mutation.isPending ? "Creando..." : "Crear incidencia"}
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
