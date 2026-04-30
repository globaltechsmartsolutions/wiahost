import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/lib/theme";

type CardProps = {
  children: ReactNode;
  compact?: boolean;
};

export function Card({ children, compact }: CardProps) {
  return (
    <View style={[styles.card, compact && styles.compactCard]}>{children}</View>
  );
}

export function StatCard({
  helper,
  label,
  value,
}: {
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <Card compact>
      <Text style={styles.kicker}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted}>{helper}</Text>
    </Card>
  );
}

export function StatusBadge({ label }: { label: string }) {
  const tone =
    label.toLowerCase().includes("alta") ||
    label.toLowerCase().includes("urgente") ||
    label.toLowerCase().includes("abierta")
      ? styles.badgeDanger
      : label.toLowerCase().includes("confirm") ||
          label.toLowerCase().includes("activo") ||
          label.toLowerCase().includes("resuelta")
        ? styles.badgePositive
        : styles.badgeNeutral;

  return (
    <View style={[styles.badge, tone]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export function ListItem({
  badge,
  helper,
  meta,
  onPress,
  title,
}: {
  badge?: string;
  helper?: string;
  meta?: string;
  onPress?: () => void;
  title: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.listItem}>
      <View style={styles.listText}>
        <Text style={styles.itemTitle}>{title}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        {helper ? <Text style={styles.muted}>{helper}</Text> : null}
      </View>
      {badge ? <StatusBadge label={badge} /> : null}
    </Pressable>
  );
}

export function SectionTitle({
  children,
  helper,
}: {
  children: ReactNode;
  helper?: string;
}) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{children}</Text>
      {helper ? <Text style={styles.muted}>{helper}</Text> : null}
    </View>
  );
}

export function EmptyState({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <Card>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text style={styles.muted}>{children}</Text>
    </Card>
  );
}

export function OfflineBanner({ cachedAt }: { cachedAt?: string }) {
  const label = cachedAt
    ? new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
      }).format(new Date(cachedAt))
    : "ultima sincronizacion";

  return (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineTitle}>Modo offline read-only</Text>
      <Text style={styles.offlineCopy}>
        Mostrando la ficha guardada en {label}. Vuelve a refrescar cuando haya
        red.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeDanger: {
    backgroundColor: "#fff2ee",
    borderColor: "#ffb0a3",
  },
  badgeNeutral: {
    backgroundColor: "#fff8e6",
    borderColor: "#ead4a8",
  },
  badgePositive: {
    backgroundColor: "#e6fff2",
    borderColor: "#8be3bd",
  },
  badgeText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  compactCard: {
    flex: 1,
    minWidth: 150,
  },
  itemTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  kicker: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.4,
    textTransform: "uppercase",
  },
  listItem: {
    alignItems: "flex-start",
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    padding: 13,
  },
  listText: {
    flex: 1,
    gap: 4,
  },
  meta: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  muted: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  offlineBanner: {
    backgroundColor: "#fff8e6",
    borderColor: "#ead4a8",
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    padding: 13,
  },
  offlineCopy: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  offlineTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
  },
  sectionHeading: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  sectionTitle: {
    gap: 3,
  },
  statValue: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
});
