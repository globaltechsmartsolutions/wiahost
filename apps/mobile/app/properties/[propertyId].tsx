import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Card, EmptyState, SectionTitle, StatusBadge } from "@/src/components/cards";
import { Screen } from "@/src/components/screen";
import { colors } from "@/src/lib/theme";
import { useMobileDashboard } from "@/src/hooks/use-mobile-dashboard";

export default function PropertyDetailScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { data, isLoading, refetch, isRefetching } = useMobileDashboard();
  const property = data?.properties.find((item) => item.id === propertyId);

  return (
    <Screen
      isLoading={isLoading}
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
      subtitle="Ficha rapida del activo para revisar contexto antes de actuar."
      title={property?.name ?? "Activo"}
    >
      {property ? (
        <>
          <Card>
            <View style={styles.headerRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{property.city.slice(0, 3).toUpperCase()}</Text>
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{property.name}</Text>
                <Text style={styles.meta}>
                  {property.internalName} - {property.city}
                </Text>
              </View>
              <StatusBadge label={property.status} />
            </View>
          </Card>
          <Card>
            <SectionTitle helper="Datos base para revenue y operaciones.">
              Operativa
            </SectionTitle>
            <DetailRow label="Ciudad" value={property.city} />
            <DetailRow label="Precio base" value={`${property.basePrice} EUR`} />
            <DetailRow label="Estado" value={property.status} />
          </Card>
        </>
      ) : (
        <EmptyState title="Activo no encontrado">
          No hemos encontrado esta propiedad en la cache movil.
        </EmptyState>
      )}
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: 18,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  avatarText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  detailRow: {
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 13,
  },
  detailValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
});
