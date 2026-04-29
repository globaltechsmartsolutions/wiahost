import { router } from "expo-router";

import { Card, EmptyState, ListItem, SectionTitle } from "@/src/components/cards";
import { Screen } from "@/src/components/screen";
import { useMobileDashboard } from "@/src/hooks/use-mobile-dashboard";

export default function PropertiesScreen() {
  const { data, isLoading, refetch, isRefetching } = useMobileDashboard();
  const properties = data?.properties ?? [];

  return (
    <Screen
      isLoading={isLoading}
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
      subtitle="Portfolio sincronizado para revisar estado, ciudad y precio base desde el movil."
      title="Activos"
    >
      <Card>
        <SectionTitle helper={`${properties.length} propiedades visibles`}>
          Portfolio operativo
        </SectionTitle>
        {properties.length ? (
          properties.map((property) => (
            <ListItem
              badge={property.status}
              helper={`${property.basePrice} EUR base`}
              key={property.id}
              meta={`${property.city} - ${property.internalName}`}
              onPress={() =>
                router.push({
                  pathname: "/properties/[propertyId]",
                  params: { propertyId: property.id },
                })
              }
              title={property.name}
            />
          ))
        ) : (
          <EmptyState title="Sin activos">No hay propiedades disponibles.</EmptyState>
        )}
      </Card>
    </Screen>
  );
}
