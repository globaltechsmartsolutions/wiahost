import { type PropertyInput } from "@wiahost/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";

import { Screen } from "@/src/components/screen";
import { PropertyForm } from "@/src/features/properties/property-form";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

const defaultValues: PropertyInput = {
  addressLine: "",
  bathrooms: 1,
  bedrooms: 1,
  city: "",
  cleaningFee: 35,
  country: "Espana",
  description: "",
  internalName: "",
  maxGuests: 2,
  name: "",
  province: "",
  status: "draft",
  basePrice: 120,
};

async function createProperty(input: PropertyInput) {
  if (!isSupabaseConfigured()) {
    throw new Error("Configura Supabase en apps/mobile/.env para crear activos.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("properties").insert({
    address_line: input.addressLine,
    base_price: input.basePrice,
    bathrooms: input.bathrooms,
    bedrooms: input.bedrooms,
    city: input.city,
    cleaning_fee: input.cleaningFee,
    country: input.country,
    created_by: user?.id ?? null,
    description: input.description ?? null,
    internal_name: input.internalName ?? null,
    max_guests: input.maxGuests,
    name: input.name,
    province: input.province ?? null,
    status: input.status,
  });

  if (error) {
    throw error;
  }
}

export default function NewPropertyScreen() {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: createProperty,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] });
      router.replace("/properties");
    },
  });

  const submit = async (values: PropertyInput) => {
    setFormError(null);

    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "No hemos podido crear el activo.",
      );
    }
  };

  return (
    <Screen
      subtitle="Alta rapida de activo para empezar a sincronizar operacion y canales."
      title="Nuevo activo"
    >
      <PropertyForm
        defaultValues={defaultValues}
        formError={formError}
        isPending={mutation.isPending}
        onSubmit={submit}
        pendingLabel="Creando..."
        submitLabel="Crear activo"
      />
    </Screen>
  );
}
