import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@wiahost/shared";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text } from "react-native";

import { Card } from "@/src/components/cards";
import { Field, PrimaryButton } from "@/src/components/form";
import { Screen } from "@/src/components/screen";
import { useAuth } from "@/src/features/auth/auth-provider";
import { colors } from "@/src/lib/theme";

export default function LoginScreen() {
  const { session, signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<LoginInput>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (session) {
      router.replace("/");
    }
  }, [session]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setIsSubmitting(true);

    try {
      await signIn(values.email, values.password);
      router.replace("/");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No hemos podido iniciar sesion.",
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Screen
      subtitle="Accede con la misma cuenta operativa que usas en la web."
      title="Entrar"
    >
      <Card>
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
              placeholder="operaciones@wiahost.local"
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
              placeholder="Password123!"
              secureTextEntry
              value={field.value}
            />
          )}
        />
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <PrimaryButton disabled={isSubmitting} onPress={onSubmit}>
          {isSubmitting ? "Entrando..." : "Entrar en WIAHost"}
        </PrimaryButton>
        <PrimaryButton
          onPress={() => router.push("/register")}
          variant="secondary"
        >
          Crear cuenta nueva
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
});
