import { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { colors } from "@/src/lib/theme";

export function Field({
  error,
  label,
  style,
  ...props
}: TextInputProps & {
  error?: string;
  label: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        placeholderTextColor="#9b8f80"
        style={[styles.input, error && styles.inputError, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function PrimaryButton({
  children,
  disabled,
  onPress,
  variant = "primary",
}: {
  children: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  variant?: "primary" | "secondary";
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        variant === "secondary" && styles.secondaryButton,
        disabled && styles.disabledButton,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "secondary" && styles.secondaryButtonText,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export function SelectPill({
  active,
  children,
  onPress,
}: {
  active?: boolean;
  children: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active && styles.activePill]}
    >
      <Text style={[styles.pillText, active && styles.activePillText]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activePill: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  activePillText: {
    color: colors.lime,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: 16,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonText: {
    color: colors.lime,
    fontSize: 15,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.55,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  field: {
    gap: 7,
  },
  input: {
    backgroundColor: "#fffaf2",
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: colors.danger,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
  },
  pill: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  pillText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: colors.border,
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: colors.ink,
  },
});
