import Link from "next/link";

import { createGuestAction } from "@/lib/actions/guests";
import { getGuests } from "@/lib/data/guests";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

type GuestsPageProps = {
  searchParams?: Promise<{ created?: string; error?: string; q?: string }>;
};

function matches(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export default async function GuestsPage({ searchParams }: GuestsPageProps) {
  const [guests, params] = await Promise.all([getGuests(), searchParams]);
  const query = params?.q?.trim() ?? "";
  const filteredGuests = guests.filter((guest) =>
    query
      ? matches(
          `${guest.name} ${guest.email} ${guest.phone} ${guest.latestContext}`,
          query,
        )
      : true,
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="CRM de huespedes"
        title="Historial, preferencias y contexto antes de responder."
        description="Cada interaccion debe llegar con contexto: idioma, reservas, incidencias, pagos, reviews y etiquetas."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}
      {params?.created ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Huesped creado correctamente.
        </div>
      ) : null}

      <Card className="rounded-[1.6rem] border-border/80 bg-card/80">
        <CardContent className="p-4">
          <form className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid gap-2">
              <Label htmlFor="guestSearch">Buscar</Label>
              <Input
                id="guestSearch"
                name="q"
                defaultValue={query}
                placeholder="Nombre, email, telefono o contexto"
              />
            </div>
            <Button type="submit" className="rounded-full">
              Filtrar
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Mostrando {filteredGuests.length} de {guests.length} huespedes.
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Nuevo huesped</CardTitle>
            <CardDescription>
              Guarda contexto antes de que llegue por canal, web directa o
              telefono.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createGuestAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Nombre</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preferredLanguage">Idioma</Label>
                <select
                  id="preferredLanguage"
                  name="preferredLanguage"
                  defaultValue="es"
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="es">Espanol</option>
                  <option value="en">Ingles</option>
                  <option value="fr">Frances</option>
                  <option value="de">Aleman</option>
                </select>
              </div>
              <Textarea
                name="notes"
                placeholder="Preferencias, contexto de llegada o notas internas."
              />
              <Button type="submit" className="rounded-full">
                Crear huesped
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="grid auto-rows-fr gap-4 md:grid-cols-2">
          {filteredGuests.map((guest) => (
            <Card
              key={guest.id}
              className="h-full rounded-[2rem] border-border/80 bg-card/80"
            >
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">
                      {guest.name}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {guest.email}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#dfd2bf] px-3 py-1 text-xs font-semibold uppercase">
                    {guest.language}
                  </span>
                </div>
                <div className="mt-6 rounded-3xl bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {guest.reservationCount} reservas
                  </p>
                  <p className="mt-3 text-sm">{guest.latestContext}</p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  {guest.tags.length ? (
                    guest.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#e8f7d2] px-3 py-1 text-xs font-semibold text-[#304000]"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">
                      Sin etiquetas
                    </span>
                  )}
                  <span className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">
                    {guest.phone}
                  </span>
                </div>
                <div className="mt-5 flex justify-end">
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href={`/guests/${guest.id}`}>Ver ficha</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </section>
    </AppShell>
  );
}
