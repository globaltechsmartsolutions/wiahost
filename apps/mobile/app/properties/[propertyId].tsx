import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Card, EmptyState, SectionTitle, StatusBadge } from "@/src/components/cards";
import { PrimaryButton } from "@/src/components/form";
import { Screen } from "@/src/components/screen";
import { usePropertyDetail } from "@/src/hooks/use-property-detail";
import { isSupabaseConfigured } from "@/src/lib/supabase";
import { colors } from "@/src/lib/theme";
import { isGuid } from "@/src/lib/utils";

export default function PropertyDetailScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { data: property, isLoading, refetch, isRefetching } =
    usePropertyDetail(propertyId);
  const canEditProperty =
    Boolean(property) && isSupabaseConfigured() && isGuid(property?.id ?? "");

  return (
    <Screen
      isLoading={isLoading}
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
      subtitle="Ficha rapida del activo para revisar contexto antes de actuar."
      title={property?.name ?? "Activo"}
      action={
        canEditProperty ? (
          <PrimaryButton
            onPress={() =>
              router.push({
                pathname: "/properties/edit/[propertyId]",
                params: { propertyId: propertyId ?? "" },
              })
            }
            variant="secondary"
          >
            Editar
          </PrimaryButton>
        ) : null
      }
    >
      {property ? (
        <>
          <Card>
            <View style={styles.headerRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {property.city.slice(0, 3).toUpperCase()}
                </Text>
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{property.name}</Text>
                <Text style={styles.meta}>
                  {property.internalName || property.id.slice(0, 8)} -{" "}
                  {property.city}
                </Text>
              </View>
              <StatusBadge label={property.statusLabel} />
            </View>
          </Card>
          <Card>
            <SectionTitle helper="Datos base para revenue y operaciones.">
              Operativa
            </SectionTitle>
            <DetailRow label="Ciudad" value={property.city} />
            <DetailRow label="Precio base" value={`${property.basePrice} EUR`} />
            <DetailRow label="Limpieza" value={`${property.cleaningFee} EUR`} />
            <DetailRow
              label="Capacidad"
              value={`${property.maxGuests} huespedes`}
            />
            <DetailRow label="Estado" value={property.statusLabel} />
            {!canEditProperty ? (
              <Text style={styles.meta}>
                Modo demo o dato no editable desde mobile. Conecta Supabase y abre
                un activo real para editarlo.
              </Text>
            ) : null}
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
