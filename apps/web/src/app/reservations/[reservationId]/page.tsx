import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReservationDetail } from "@/lib/data/operations";

export const dynamic = "force-dynamic";

type ReservationDetailPageProps = {
  params: Promise<{ reservationId: string }>;
  searchParams: Promise<{ created?: string; updated?: string }>;
};

export default async function ReservationDetailPage({
  params,
  searchParams,
}: ReservationDetailPageProps) {
  const [{ reservationId }, { created, updated }] = await Promise.all([
    params,
    searchParams,
  ]);
  const reservation = await getReservationDetail(reservationId);

  if (!reservation) {
    notFound();
  }

  return (
    <AppShell>
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/reservations">Volver a reservas</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href={`/reservations/${reservation.id}/edit`}>
              Editar reserva
            </Link>
          </Button>
        </div>
      </div>

      <PageHeader
        eyebrow="Detalle de reserva"
        title={reservation.guest}
        description={`${reservation.property} - ${reservation.dates}`}
      />
      {created ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Reserva creada correctamente.
        </div>
      ) : null}
      {updated ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Reserva actualizada correctamente.
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.7fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Resumen comercial</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge value={reservation.status} />
              <StatusBadge value={reservation.channel} />
              <span className="rounded-full bg-background px-4 py-2 text-xl font-semibold">
                {reservation.amount}
              </span>
            </div>
            <p className="rounded-3xl bg-background/70 p-5 text-sm leading-6 text-muted-foreground">
              {reservation.notes}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Datos clave</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {reservation.fields.map((field) => (
              <div
                key={field.label}
                className="flex items-center justify-between gap-4 rounded-2xl bg-background/70 px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">
                  {field.label}
                </span>
                <span className="text-right text-sm font-semibold">
                  {field.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
