import { zodResolver } from "@hookform/resolvers/zod";
import {
  bookingChannels,
  manualReservationSchema,
  type BookingChannel,
  type ManualReservationInput,
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

const channelLabels: Record<BookingChannel, string> = {
  airbnb: "Airbnb",
  booking: "Booking",
  direct: "Directo",
  expedia: "Expedia",
  google_vacation_rentals: "Google",
  manual: "Manual",
  vrbo: "Vrbo",
};

function isoDate(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

function nightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  const nights = Math.round((end - start) / 86_400_000);
  return Math.max(1, Number.isFinite(nights) ? nights : 1);
}

async function createReservation(input: ManualReservationInput) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Configura Supabase en apps/mobile/.env para crear reservas.",
    );
  }

  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .insert({
      email: input.guestEmail ?? null,
      full_name: input.guestFullName,
      phone: input.guestPhone ?? null,
      preferred_language: "es",
    })
    .select("id")
    .single();

  if (guestError || !guest) {
    throw guestError ?? new Error("No se ha podido crear el huesped.");
  }

  const nights = nightsBetween(input.checkIn, input.checkOut);
  const totalAmount =
    input.nightlyRate * nights + input.cleaningFee + input.taxesAmount;

  const { error } = await supabase.from("reservations").insert({
    channel: input.channel,
    check_in: input.checkIn,
    check_out: input.checkOut,
    cleaning_fee: input.cleaningFee,
    guest_id: guest.id,
    guests_count: input.guestsCount,
    nightly_rate: input.nightlyRate,
    notes: input.notes ?? null,
    payout_amount: Math.max(0, totalAmount - input.cleaningFee),
    property_id: input.propertyId,
    security_deposit: input.securityDeposit,
    status: input.status,
    taxes_amount: input.taxesAmount,
    total_amount: totalAmount,
  });

  if (error) {
    throw error;
  }
}

export default function NewReservationScreen() {
  const queryClient = useQueryClient();
  const { data } = useMobileDashboard();
  const [formError, setFormError] = useState<string | null>(null);
  const defaultDates = useMemo(
    () => ({
      checkIn: isoDate(1),
      checkOut: isoDate(3),
    }),
    [],
  );
  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    watch,
  } = useForm<ManualReservationInput>({
    defaultValues: {
      channel: "manual",
      checkIn: defaultDates.checkIn,
      checkOut: defaultDates.checkOut,
      cleaningFee: 35,
      guestEmail: "",
      guestFullName: "",
      guestPhone: "",
      guestsCount: 2,
      nightlyRate: 120,
      notes: "",
      propertyId: "",
      securityDeposit: 0,
      status: "confirmed",
      taxesAmount: 0,
    },
    resolver: zodResolver(
      manualReservationSchema,
    ) as Resolver<ManualReservationInput>,
  });
  const selectedChannel = watch("channel");
  const selectedPropertyId = watch("propertyId");
  const propertyOptions = (data?.properties ?? []).filter((property) =>
    isGuid(property.id),
  );
  const mutation = useMutation({
    mutationFn: createReservation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
      router.replace("/reservations");
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
          : "No hemos podido crear la reserva.",
      );
    }
  });

  return (
    <Screen
      subtitle="Crea una reserva manual o directa y deja la operacion lista para el calendario."
      title="Nueva reserva"
    >
      {!isSupabaseConfigured() ? (
        <EmptyState title="Conecta Supabase">
          La creacion real de reservas necesita `apps/mobile/.env`. En modo demo
          solo mostramos datos.
        </EmptyState>
      ) : (
        <>
          <Card>
            <SectionTitle helper="Activo donde se alojara el huesped.">
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
            <SectionTitle helper="Datos de contacto para inbox y operaciones.">
              Huesped
            </SectionTitle>
            <Controller
              control={control}
              name="guestFullName"
              render={({ field }) => (
                <Field
                  autoCapitalize="words"
                  error={errors.guestFullName?.message}
                  label="Nombre"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Sofia Martin"
                  testID="reservation-guest-name"
                  value={field.value}
                />
              )}
            />
            <Controller
              control={control}
              name="guestEmail"
              render={({ field }) => (
                <Field
                  error={errors.guestEmail?.message}
                  keyboardType="email-address"
                  label="Email"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="sofia@email.com"
                  testID="reservation-guest-email"
                  value={field.value}
                />
              )}
            />
            <Controller
              control={control}
              name="guestPhone"
              render={({ field }) => (
                <Field
                  error={errors.guestPhone?.message}
                  keyboardType="phone-pad"
                  label="Telefono"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="+34 600 000 000"
                  testID="reservation-guest-phone"
                  value={field.value}
                />
              )}
            />
          </Card>

          <Card>
            <SectionTitle helper="Fechas, canal e importe.">
              Estancia
            </SectionTitle>
            <View style={styles.row}>
              <DateField
                control={control}
                error={errors.checkIn?.message}
                label="Entrada"
                name="checkIn"
              />
              <DateField
                control={control}
                error={errors.checkOut?.message}
                label="Salida"
                name="checkOut"
              />
            </View>
            <View style={styles.row}>
              <NumberField
                control={control}
                error={errors.guestsCount?.message}
                label="Huesp."
                name="guestsCount"
              />
              <NumberField
                control={control}
                error={errors.nightlyRate?.message}
                label="Noche"
                name="nightlyRate"
              />
              <NumberField
                control={control}
                error={errors.cleaningFee?.message}
                label="Limpieza"
                name="cleaningFee"
              />
            </View>
            <View style={styles.row}>
              <NumberField
                control={control}
                error={errors.taxesAmount?.message}
                label="Tasas"
                name="taxesAmount"
              />
              <NumberField
                control={control}
                error={errors.securityDeposit?.message}
                label="Deposito"
                name="securityDeposit"
              />
            </View>
            <View style={styles.statusBlock}>
              <SectionTitle helper="Origen de la reserva.">Canal</SectionTitle>
              <View style={styles.pillGrid}>
                {bookingChannels.map((channel) => (
                  <SelectPill
                    active={selectedChannel === channel}
                    key={channel}
                    onPress={() =>
                      setValue("channel", channel, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    {channelLabels[channel]}
                  </SelectPill>
                ))}
              </View>
            </View>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <Field
                  error={errors.notes?.message}
                  label="Notas"
                  multiline
                  numberOfLines={3}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Llegada prevista, peticiones, contexto interno..."
                  style={styles.textarea}
                  value={field.value}
                />
              )}
            />
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            <PrimaryButton disabled={mutation.isPending} onPress={onSubmit}>
              {mutation.isPending ? "Creando..." : "Crear reserva"}
            </PrimaryButton>
          </Card>
        </>
      )}
    </Screen>
  );
}

type ReservationNumberFieldName = keyof Pick<
  ManualReservationInput,
  | "cleaningFee"
  | "guestsCount"
  | "nightlyRate"
  | "securityDeposit"
  | "taxesAmount"
>;

function NumberField({
  control,
  error,
  label,
  name,
}: {
  control: ReturnType<typeof useForm<ManualReservationInput>>["control"];
  error?: string;
  label: string;
  name: ReservationNumberFieldName;
}) {
  return (
    <View style={styles.numberField}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Field
            error={error}
            keyboardType="numeric"
            label={label}
            onBlur={field.onBlur}
            onChangeText={(value) => field.onChange(Number(value) || 0)}
            value={String(field.value ?? "")}
          />
        )}
      />
    </View>
  );
}

function DateField({
  control,
  error,
  label,
  name,
}: {
  control: ReturnType<typeof useForm<ManualReservationInput>>["control"];
  error?: string;
  label: string;
  name: "checkIn" | "checkOut";
}) {
  return (
    <View style={styles.dateField}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Field
            error={error}
            label={label}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="2026-05-01"
            value={field.value}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dateField: {
    flex: 1,
    minWidth: 145,
  },
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
  numberField: {
    flex: 1,
    minWidth: 92,
  },
  pillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statusBlock: {
    gap: 10,
  },
  textarea: {
    minHeight: 94,
    paddingTop: 14,
    textAlignVertical: "top",
  },
});
