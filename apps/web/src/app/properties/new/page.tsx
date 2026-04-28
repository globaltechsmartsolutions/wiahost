import Link from "next/link";

import { PropertyForm } from "@/components/forms/property-form";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AppShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          eyebrow="Inventario"
          title="Crear una propiedad lista para canales y operaciones."
          description="Añade los datos base del alojamiento. Después conectaremos listings por canal, fotos, reglas, automatizaciones y documentación."
        />
        <Button asChild variant="outline" className="rounded-full border-[#dfd2bf] bg-white/70">
          <Link href="/properties">Volver al inventario</Link>
        </Button>
      </div>
      <PropertyForm error={error} />
    </AppShell>
  );
}
