import { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/src/lib/theme";

type ScreenProps = PropsWithChildren<{
  action?: ReactNode;
  isLoading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  subtitle?: string;
  title: string;
}>;

export function Screen({
  action,
  children,
  isLoading,
  onRefresh,
  refreshing,
  subtitle,
  title,
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              onRefresh={onRefresh}
              refreshing={Boolean(refreshing)}
              tintColor={colors.ink}
            />
          ) : undefined
        }
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>WIAHost mobile</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {action}
        </View>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.ink} />
            <Text style={styles.loadingText}>Cargando operativa...</Text>
          </View>
        ) : (
          children
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 32,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
    gap: 5,
  },
  loading: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    minHeight: 180,
    justifyContent: "center",
  },
  loadingText: {
    color: colors.muted,
    fontWeight: "700",
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1.2,
    lineHeight: 34,
  },
});
