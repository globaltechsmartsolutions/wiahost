import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGuestDetail } from "@/lib/data/guests";

export const dynamic = "force-dynamic";

type GuestDetailPageProps = {
  params: Promise<{ guestId: string }>;
  searchParams: Promise<{ updated?: string }>;
};

export default async function GuestDetailPage({
  params,
  searchParams,
}: GuestDetailPageProps) {
  const [{ guestId }, { updated }] = await Promise.all([params, searchParams]);
  const guest = await getGuestDetail(guestId);

  if (!guest) {
    notFound();
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/guests">Volver a huespedes</Link>
        </Button>
        <Button asChild className="rounded-full">
          <Link href={`/guests/${guest.id}/edit`}>Editar huesped</Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Ficha de huesped"
        title={guest.name}
        description="Contexto de reservas, conversaciones, preferencias y notas antes de escribir o tomar una decision operativa."
      />

      {updated ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Huesped actualizado correctamente.
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-5">
          <Card className="rounded-[2rem] border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>Perfil operativo</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <DetailRow label="Email" value={guest.email} />
              <DetailRow label="Telefono" value={guest.phone} />
              <DetailRow label="Idioma" value={guest.language.toUpperCase()} />
              <DetailRow
                label="Reservas"
                value={String(guest.reservationCount)}
              />
              <DetailRow label="Creado" value={guest.createdAt} />
              <div className="flex flex-wrap gap-2 pt-2">
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
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>Notas internas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="rounded-3xl bg-background/70 p-5 text-sm leading-6 text-muted-foreground">
                {guest.notes}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5">
          <Card className="rounded-[2rem] border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>Reservas del huesped</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {guest.reservations.length ? (
                guest.reservations.map((reservation) => (
                  <Link
                    key={reservation.id}
                    href={`/reservations/${reservation.id}`}
                    className="rounded-3xl border border-border/80 bg-background/70 p-4 transition hover:border-foreground/30"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{reservation.property}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {reservation.dates} - {reservation.channel}
                        </p>
                      </div>
                      <StatusBadge value={reservation.status} />
                    </div>
                    <p className="mt-4 text-xl font-semibold">
                      {reservation.amount}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="rounded-3xl bg-background/70 p-5 text-sm text-muted-foreground">
                  Todavia no hay reservas asociadas a este huesped.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>Conversaciones</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {guest.conversations.length ? (
                guest.conversations.map((conversation) => (
                  <Link
                    key={conversation.id}
                    href={`/inbox/${conversation.id}`}
                    className="rounded-3xl border border-border/80 bg-background/70 p-4 transition hover:border-foreground/30"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{conversation.property}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Ultima actividad: {conversation.lastActivity}
                        </p>
                      </div>
                      <StatusBadge value={conversation.status} />
                    </div>
                  </Link>
                ))
              ) : (
                <p className="rounded-3xl bg-background/70 p-5 text-sm text-muted-foreground">
                  Sin conversaciones recientes.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-background/70 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold">{value}</span>
    </div>
  );
}
