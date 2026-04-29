import { type PropertyInput } from "@wiahost/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { EmptyState } from "@/src/components/cards";
import { Screen } from "@/src/components/screen";
import { PropertyForm } from "@/src/features/properties/property-form";
import { usePropertyDetail } from "@/src/hooks/use-property-detail";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { isGuid } from "@/src/lib/utils";

async function updateProperty({
  input,
  propertyId,
}: {
  input: PropertyInput;
  propertyId: string;
}) {
  if (!isSupabaseConfigured()) {
    throw new Error("Configura Supabase en apps/mobile/.env para editar activos.");
  }

  if (!isGuid(propertyId)) {
    throw new Error(
      "Este activo demo es solo lectura. Abre un activo real para editarlo.",
    );
  }

  const { error } = await supabase
    .from("properties")
    .update({
      address_line: input.addressLine,
      base_price: input.basePrice,
      bathrooms: input.bathrooms,
      bedrooms: input.bedrooms,
      city: input.city,
      cleaning_fee: input.cleaningFee,
      country: input.country,
      description: input.description ?? null,
      internal_name: input.internalName ?? null,
      max_guests: input.maxGuests,
      name: input.name,
      province: input.province ?? null,
      status: input.status,
    })
    .eq("id", propertyId);

  if (error) {
    throw error;
  }
}

export default function EditPropertyScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { data: property, isLoading, refetch, isRefetching } =
    usePropertyDetail(propertyId);
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const canEditProperty =
    Boolean(property) && isSupabaseConfigured() && isGuid(property?.id ?? "");
  const mutation = useMutation({
    mutationFn: updateProperty,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
      await queryClient.invalidateQueries({
        queryKey: ["property-detail", propertyId],
      });
      router.replace({
        pathname: "/properties/[propertyId]",
        params: { propertyId: propertyId ?? "" },
      });
    },
  });

  const submit = async (values: PropertyInput) => {
    setFormError(null);

    try {
      await mutation.mutateAsync({
        input: values,
        propertyId: propertyId ?? "",
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No hemos podido editar el activo.",
      );
    }
  };

  return (
    <Screen
      isLoading={isLoading}
      onRefresh={() => void refetch()}
      refreshing={isRefetching}
      subtitle="Edita precio base, capacidad, ubicacion y estado sin abrir el panel web."
      title={property?.name ?? "Editar activo"}
    >
      {property && canEditProperty ? (
        <PropertyForm
          defaultValues={property}
          formError={formError}
          isPending={mutation.isPending}
          onSubmit={submit}
          pendingLabel="Guardando..."
          submitLabel="Guardar cambios"
        />
      ) : (
        <EmptyState title="Activo no editable">
          Conecta Supabase y abre un activo real para editarlo desde mobile.
        </EmptyState>
      )}
    </Screen>
  );
}
