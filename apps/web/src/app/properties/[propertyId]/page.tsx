import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { activatePropertyAction, archivePropertyAction } from "@/lib/actions/properties";
import { getPropertyById } from "@/lib/data/properties";

type PropertyDetailPageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams: Promise<{ activated?: string; archived?: string; error?: string; updated?: string }>;
};

export default async function PropertyDetailPage({ params, searchParams }: PropertyDetailPageProps) {
  const [{ propertyId }, flags] = await Promise.all([params, searchParams]);
  const property = await getPropertyById(propertyId);

  if (!property) {
    notFound();
  }

  const successMessage = flags.updated
    ? "Propiedad actualizada correctamente."
    : flags.archived
      ? "Propiedad archivada de forma segura."
      : flags.activated
        ? "Propiedad reactivada correctamente."
        : null;

  return (
    <AppShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          eyebrow="Inventario"
          title={property.name}
          description="Ficha operativa del activo: datos base, capacidad, pricing y estado para canales."
        />
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-full border-[#dfd2bf] bg-white/70">
            <Link href="/properties">Volver</Link>
          </Button>
          <Button asChild className="rounded-full bg-[#160f09] px-6 text-white hover:bg-[#2b1d10]">
            <Link href={`/properties/${property.id}/edit`}>Editar</Link>
          </Button>
        </div>
      </div>

      {flags.error ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {flags.error}
        </div>
      ) : null}
      {successMessage ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Datos principales</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">{property.internalName}</p>
              </div>
              <StatusBadge value={property.status} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="rounded-3xl bg-background/70 p-4 text-sm text-muted-foreground">
              {property.description ?? "Sin descripcion todavia."}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="Direccion" value={property.addressLine} />
              <Info label="Ciudad" value={`${property.city}${property.province ? `, ${property.province}` : ""}`} />
              <Info label="Pais" value={property.country} />
              <Info label="Canal principal" value={property.channel} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Control operativo</CardTitle>
            <p className="text-sm text-muted-foreground">Archivo seguro antes de eliminar datos sensibles o historicos.</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Info label="Dormitorios" value={String(property.bedrooms ?? 0)} />
            <Info label="Banos" value={String(property.bathrooms)} />
            <Info label="Huespedes" value={String(property.maxGuests)} />
            <Info label="Precio base" value={`${property.basePrice ?? 0} EUR`} />
            <Info label="Limpieza" value={`${property.cleaningFee} EUR`} />

            {property.statusValue === "archived" ? (
              <form action={activatePropertyAction}>
                <input type="hidden" name="propertyId" value={property.id} />
                <Button className="w-full rounded-full">Reactivar propiedad</Button>
              </form>
            ) : (
              <form action={archivePropertyAction}>
                <input type="hidden" name="propertyId" value={property.id} />
                <Button variant="outline" className="w-full rounded-full border-red-200 text-red-700 hover:bg-red-50">
                  Archivar propiedad
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-background/70 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-semibold">{value}</p>
    </div>
  );
}
