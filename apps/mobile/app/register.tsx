import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  roleLabels,
  userRoles,
  type RegisterInput,
  type UserRole,
} from "@wiahost/shared";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

import { Card, SectionTitle } from "@/src/components/cards";
import { Field, PrimaryButton, SelectPill } from "@/src/components/form";
import { Screen } from "@/src/components/screen";
import { useAuth } from "@/src/features/auth/auth-provider";
import { colors } from "@/src/lib/theme";

const allowedRoles = userRoles.filter((role) => role !== "admin");

export default function RegisterScreen() {
  const { session, signUp } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
    watch,
  } = useForm<RegisterInput>({
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      role: "operator",
    },
    resolver: zodResolver(registerSchema) as Resolver<RegisterInput>,
  });
  const selectedRole = watch("role");

  useEffect(() => {
    if (session) {
      router.replace("/");
    }
  }, [session]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setIsSubmitting(true);

    try {
      await signUp(values);
      router.replace("/");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "No hemos podido crear la cuenta.",
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Screen
      subtitle="Crea una cuenta para operaciones, propietarios, limpieza o mantenimiento."
      title="Crear cuenta"
    >
      <Card>
        <Controller
          control={control}
          name="fullName"
          render={({ field }) => (
            <Field
              autoCapitalize="words"
              error={errors.fullName?.message}
              label="Nombre completo"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Laura Operaciones"
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Field
              error={errors.email?.message}
              keyboardType="email-address"
              label="Email"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="tu@email.com"
              value={field.value}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Field
              error={errors.password?.message}
              label="Password"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Minimo 8 caracteres"
              secureTextEntry
              value={field.value}
            />
          )}
        />
        <View style={styles.roleBlock}>
          <SectionTitle helper="El rol controla que puede ver cada usuario.">
            Rol
          </SectionTitle>
          <View style={styles.roleGrid}>
            {allowedRoles.map((role) => (
              <SelectPill
                active={selectedRole === role}
                key={role}
                onPress={() =>
                  setValue("role", role as UserRole, { shouldValidate: true })
                }
              >
                {roleLabels[role]}
              </SelectPill>
            ))}
          </View>
          {errors.role?.message ? (
            <Text style={styles.error}>{errors.role.message}</Text>
          ) : null}
        </View>
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <PrimaryButton disabled={isSubmitting} onPress={onSubmit}>
          {isSubmitting ? "Creando..." : "Crear cuenta"}
        </PrimaryButton>
        <PrimaryButton onPress={() => router.push("/login")} variant="secondary">
          Ya tengo cuenta
        </PrimaryButton>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "800",
  },
  roleBlock: {
    gap: 10,
  },
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
