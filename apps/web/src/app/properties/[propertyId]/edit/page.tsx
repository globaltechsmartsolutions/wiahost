import Link from "next/link";
import { notFound } from "next/navigation";

import { PropertyForm } from "@/components/forms/property-form";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getPropertyById } from "@/lib/data/properties";

type EditPropertyPageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditPropertyPage({ params, searchParams }: EditPropertyPageProps) {
  const [{ propertyId }, { error }] = await Promise.all([params, searchParams]);
  const property = await getPropertyById(propertyId);

  if (!property) {
    notFound();
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          eyebrow="Inventario"
          title={`Editar ${property.name}`}
          description="Mantén la ficha del alojamiento alineada con operaciones, pricing y canales conectados."
        />
        <Button asChild variant="outline" className="rounded-full border-[#dfd2bf] bg-white/70">
          <Link href={`/properties/${property.id}`}>Volver al detalle</Link>
        </Button>
      </div>
      <PropertyForm mode="edit" error={error} initialValues={property} />
    </AppShell>
  );
}
