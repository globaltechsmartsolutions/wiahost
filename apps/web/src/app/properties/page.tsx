import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProperties } from "@/lib/data/properties";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ created }, properties] = await Promise.all([searchParams, getProperties()]);

  return (
    <AppShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          eyebrow="Inventario"
          title="Propiedades preparadas para operar en múltiples canales."
          description="Cada vivienda concentra estado operativo, publicación, revenue, próxima llegada y preparación para fotos, documentos y reglas de casa."
        />
        <Button asChild className="rounded-full bg-[#160f09] px-6 text-white hover:bg-[#2b1d10]">
          <Link href="/properties/new">Nueva propiedad</Link>
        </Button>
      </div>

      {created ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Propiedad creada correctamente.
        </div>
      ) : null}

      <section className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => (
          <Card key={property.id} className="h-full rounded-[2rem] border-border/80 bg-card/80">
            <CardContent className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{property.city}</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">{property.name}</h2>
                </div>
                <StatusBadge value={property.status} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/properties/${property.id}`}>Ver detalle</Link>
                </Button>
                <Button asChild variant="ghost" className="rounded-full">
                  <Link href={`/properties/${property.id}/edit`}>Editar</Link>
                </Button>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Canal</p>
                  <p className="mt-3 font-semibold">{property.channel}</p>
                </div>
                <div className="rounded-3xl bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Ocupación</p>
                  <p className="mt-3 font-semibold">{property.occupancy}</p>
                </div>
                <div className="rounded-3xl bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Ingresos</p>
                  <p className="mt-3 font-semibold">{property.revenue}</p>
                </div>
                <div className="rounded-3xl bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Entrada</p>
                  <p className="mt-3 font-semibold">{property.nextCheckIn}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </AppShell>
  );
}
