import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/lib/theme";

export type StatusOption<TStatus extends string> = {
  label: string;
  value: TStatus;
};

type StatusActionGroupProps<TStatus extends string> = {
  currentValue: TStatus;
  disabled?: boolean;
  helper?: string;
  onChange: (status: TStatus) => void;
  options: StatusOption<TStatus>[];
  pendingValue?: TStatus | null;
  title: string;
};

export function StatusActionGroup<TStatus extends string>({
  currentValue,
  disabled,
  helper,
  onChange,
  options,
  pendingValue,
  title,
}: StatusActionGroupProps<TStatus>) {
  return (
    <View style={styles.group}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      </View>
      <View style={styles.grid}>
        {options.map((option) => {
          const active = option.value === currentValue;
          const isPending = option.value === pendingValue;

          return (
            <Pressable
              disabled={disabled || active || Boolean(pendingValue)}
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.button,
                active && styles.activeButton,
                (disabled || Boolean(pendingValue)) && styles.disabledButton,
              ]}
            >
              <Text style={[styles.buttonText, active && styles.activeButtonText]}>
                {isPending ? "Guardando..." : option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeButton: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  activeButtonText: {
    color: colors.lime,
  },
  button: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 44,
    minWidth: "45%",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buttonText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  copy: {
    gap: 3,
  },
  disabledButton: {
    opacity: 0.62,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  group: {
    gap: 12,
  },
  helper: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  title: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
});
