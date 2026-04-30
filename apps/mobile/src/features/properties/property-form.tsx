import { zodResolver } from "@hookform/resolvers/zod";
import {
  propertySchema,
  type PropertyInput,
  type PropertyStatus,
} from "@wiahost/shared";
import { useEffect } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

import { Card, SectionTitle } from "@/src/components/cards";
import { Field, PrimaryButton, SelectPill } from "@/src/components/form";
import { colors } from "@/src/lib/theme";

type PropertyFormProps = {
  defaultValues: PropertyInput;
  formError?: string | null;
  isPending?: boolean;
  onSubmit: (input: PropertyInput) => void;
  pendingLabel: string;
  submitLabel: string;
};

const propertyStatuses: PropertyStatus[] = ["draft", "active", "paused"];
const statusLabels: Record<PropertyStatus, string> = {
  active: "Activo",
  archived: "Archivado",
  draft: "Borrador",
  paused: "Pausado",
};

export function PropertyForm({
  defaultValues,
  formError,
  isPending,
  onSubmit,
  pendingLabel,
  submitLabel,
}: PropertyFormProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<PropertyInput>({
    defaultValues,
    resolver: zodResolver(propertySchema) as Resolver<PropertyInput>,
  });
  const status = watch("status");

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <>
      <Card>
        <SectionTitle helper="Los campos usan la validacion compartida con web/backend.">
          Datos principales
        </SectionTitle>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Field
              autoCapitalize="words"
              error={errors.name?.message}
              label="Nombre publico"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Atico Gran Via Sky"
              testID="property-name"
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="internalName"
          render={({ field }) => (
            <Field
              autoCapitalize="characters"
              error={errors.internalName?.message}
              label="Codigo interno"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="MAD-GV-01"
              testID="property-internal-name"
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="addressLine"
          render={({ field }) => (
            <Field
              error={errors.addressLine?.message}
              label="Direccion"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Calle, numero, piso"
              testID="property-address"
              value={field.value}
            />
          )}
        />
        <View style={styles.row}>
          <Controller
            control={control}
            name="city"
            render={({ field }) => (
              <Field
                autoCapitalize="words"
                error={errors.city?.message}
                label="Ciudad"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Madrid"
                testID="property-city"
                value={field.value}
              />
            )}
          />
          <Controller
            control={control}
            name="province"
            render={({ field }) => (
              <Field
                autoCapitalize="words"
                error={errors.province?.message}
                label="Provincia"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Madrid"
                testID="property-province"
                value={field.value}
              />
            )}
          />
        </View>
      </Card>

      <Card>
        <SectionTitle helper="Capacidad, precio y limpieza.">
          Operativa
        </SectionTitle>
        <View style={styles.row}>
          <NumberField
            control={control}
            error={errors.bedrooms?.message}
            label="Dorm."
            name="bedrooms"
          />
          <NumberField
            control={control}
            error={errors.bathrooms?.message}
            label="Banos"
            name="bathrooms"
          />
          <NumberField
            control={control}
            error={errors.maxGuests?.message}
            label="Huesp."
            name="maxGuests"
          />
        </View>
        <View style={styles.row}>
          <NumberField
            control={control}
            error={errors.basePrice?.message}
            label="Precio base"
            name="basePrice"
          />
          <NumberField
            control={control}
            error={errors.cleaningFee?.message}
            label="Limpieza"
            name="cleaningFee"
          />
        </View>
        <View style={styles.statusBlock}>
          <SectionTitle helper="Publicalo solo cuando este revisado.">
            Estado
          </SectionTitle>
          <View style={styles.statusGrid}>
            {propertyStatuses.map((item) => (
              <SelectPill
                active={status === item}
                key={item}
                onPress={() =>
                  setValue("status", item, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                {statusLabels[item]}
              </SelectPill>
            ))}
          </View>
        </View>
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <PrimaryButton
          disabled={isPending}
          onPress={handleSubmit((values) => onSubmit(values))}
        >
          {isPending ? pendingLabel : submitLabel}
        </PrimaryButton>
      </Card>
    </>
  );
}

function NumberField({
  control,
  error,
  label,
  name,
}: {
  control: ReturnType<typeof useForm<PropertyInput>>["control"];
  error?: string;
  label: string;
  name: keyof Pick<
    PropertyInput,
    "basePrice" | "bathrooms" | "bedrooms" | "cleaningFee" | "maxGuests"
  >;
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

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
  },
  numberField: {
    flex: 1,
    minWidth: 90,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statusBlock: {
    gap: 10,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
