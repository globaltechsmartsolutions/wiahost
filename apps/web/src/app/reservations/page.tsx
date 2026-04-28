import { EmptyState } from "@/components/empty-state";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createManualReservationAction, updateReservationStatusAction } from "@/lib/actions/operations";
import { getOperationFormOptions, getReservations } from "@/lib/data/operations";

export const dynamic = "force-dynamic";

type ReservationsPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

const reservationStatuses = [
  { label: "Consulta", value: "inquiry" },
  { label: "Pendiente", value: "pending" },
  { label: "Confirmada", value: "confirmed" },
  { label: "En estancia", value: "checked_in" },
  { label: "Check-out", value: "checked_out" },
  { label: "Cancelada", value: "cancelled" },
  { label: "No show", value: "no_show" },
];

const channels = [
  { label: "Manual", value: "manual" },
  { label: "Directo", value: "direct" },
  { label: "Airbnb", value: "airbnb" },
  { label: "Booking", value: "booking" },
  { label: "Vrbo", value: "vrbo" },
  { label: "Expedia", value: "expedia" },
  { label: "Google", value: "google_vacation_rentals" },
];

export default async function ReservationsPage({ searchParams }: ReservationsPageProps) {
  const [{ properties }, reservations, params] = await Promise.all([
    getOperationFormOptions(),
    getReservations(),
    searchParams,
  ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Reservas"
        title="Pipeline desde consulta hasta check-out."
        description="Crea reservas manuales, valida estado, canal, importe, huesped y acciones antes de la llegada."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.4fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Nueva reserva manual</CardTitle>
            <CardDescription>Para llamadas, WhatsApp, web directa o reservas importadas sin canal conectado.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createManualReservationAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="propertyId">Propiedad</Label>
                <select
                  id="propertyId"
                  name="propertyId"
                  required
                  className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="guestFullName">Huesped</Label>
                  <Input id="guestFullName" name="guestFullName" required placeholder="Nombre completo" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="guestEmail">Email</Label>
                  <Input id="guestEmail" name="guestEmail" type="email" placeholder="huesped@email.com" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="checkIn">Entrada</Label>
                  <Input id="checkIn" name="checkIn" type="date" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="checkOut">Salida</Label>
                  <Input id="checkOut" name="checkOut" type="date" required />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="guestsCount">Personas</Label>
                  <Input id="guestsCount" name="guestsCount" type="number" min="1" defaultValue="2" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nightlyRate">Noche</Label>
                  <Input id="nightlyRate" name="nightlyRate" type="number" min="0" step="0.01" defaultValue="120" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cleaningFee">Limpieza</Label>
                  <Input id="cleaningFee" name="cleaningFee" type="number" min="0" step="0.01" defaultValue="40" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="channel">Canal</Label>
                  <select id="channel" name="channel" className="h-9 rounded-xl border border-input bg-background px-3 text-sm">
                    {channels.map((channel) => (
                      <option key={channel.value} value={channel.value}>
                        {channel.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="taxesAmount">Tasas</Label>
                  <Input id="taxesAmount" name="taxesAmount" type="number" min="0" step="0.01" defaultValue="0" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="securityDeposit">Deposito</Label>
                  <Input id="securityDeposit" name="securityDeposit" type="number" min="0" step="0.01" defaultValue="0" />
                </div>
              </div>

              <Textarea name="notes" placeholder="Notas internas, hora estimada de llegada o necesidades especiales." />
              <Button type="submit" className="rounded-full">Crear reserva</Button>
            </form>
          </CardContent>
        </Card>

        {reservations.length ? (
          <Card className="rounded-[2rem] border-border/80 bg-card/80">
            <CardContent className="divide-y divide-border p-0">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="grid gap-4 p-5 lg:grid-cols-[1.1fr_0.8fr_0.6fr_0.6fr_0.9fr] lg:items-center">
                  <div>
                    <p className="font-semibold">{reservation.guest}</p>
                    <p className="text-sm text-muted-foreground">{reservation.property}</p>
                  </div>
                  <p className="text-sm">{reservation.dates}</p>
                  <StatusBadge value={reservation.status} />
                  <p className="text-xl font-semibold">{reservation.amount}</p>
                  <form action={updateReservationStatusAction} className="flex gap-2">
                    <input type="hidden" name="reservationId" value={reservation.id} />
                    <select name="status" className="h-8 flex-1 rounded-xl border border-input bg-background px-2 text-xs">
                      {reservationStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" variant="outline" className="rounded-full">Cambiar</Button>
                  </form>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState title="No hay reservas todavia" description="Cuando conectes canales o crees reservas manuales apareceran aqui." />
        )}
      </section>
    </AppShell>
  );
}
