import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateManualReservationAction } from "@/lib/actions/operations";
import {
  getOperationFormOptions,
  getReservationDetail,
} from "@/lib/data/operations";

type EditReservationPageProps = {
  params: Promise<{ reservationId: string }>;
  searchParams: Promise<{ error?: string }>;
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

export default async function EditReservationPage({
  params,
  searchParams,
}: EditReservationPageProps) {
  const [{ reservationId }, { error }, options] = await Promise.all([
    params,
    searchParams,
    getOperationFormOptions(),
  ]);
  const reservation = await getReservationDetail(reservationId);

  if (!reservation) {
    notFound();
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          eyebrow="Reservas"
          title={`Editar reserva de ${reservation.guest}`}
          description="Actualiza fechas, huesped, canal, importes y estado sin perder trazabilidad operativa."
        />
        <Button
          asChild
          variant="outline"
          className="rounded-full border-[#dfd2bf] bg-white/70"
        >
          <Link href={`/reservations/${reservation.id}`}>
            Volver al detalle
          </Link>
        </Button>
      </div>

      <Card className="rounded-[2rem] border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Datos de la reserva</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          <form action={updateManualReservationAction} className="grid gap-5">
            <input type="hidden" name="reservationId" value={reservation.id} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Huesped" id="guestFullName">
                <Input
                  id="guestFullName"
                  name="guestFullName"
                  required
                  defaultValue={reservation.raw.guestFullName}
                />
              </Field>
              <Field label="Email" id="guestEmail">
                <Input
                  id="guestEmail"
                  name="guestEmail"
                  type="email"
                  defaultValue={reservation.raw.guestEmail ?? ""}
                />
              </Field>
              <Field label="Telefono" id="guestPhone">
                <Input
                  id="guestPhone"
                  name="guestPhone"
                  defaultValue={reservation.raw.guestPhone ?? ""}
                />
              </Field>
              <Field label="Propiedad" id="propertyId">
                <select
                  id="propertyId"
                  name="propertyId"
                  required
                  defaultValue={reservation.raw.propertyId}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {options.properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Canal" id="channel">
                <select
                  id="channel"
                  name="channel"
                  defaultValue={reservation.raw.channel}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {channels.map((channel) => (
                    <option key={channel.value} value={channel.value}>
                      {channel.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Estado" id="status">
                <select
                  id="status"
                  name="status"
                  defaultValue={reservation.raw.status}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {reservationStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Field label="Check-in" id="checkIn">
                <Input
                  id="checkIn"
                  name="checkIn"
                  type="date"
                  required
                  defaultValue={reservation.raw.checkIn}
                />
              </Field>
              <Field label="Check-out" id="checkOut">
                <Input
                  id="checkOut"
                  name="checkOut"
                  type="date"
                  required
                  defaultValue={reservation.raw.checkOut}
                />
              </Field>
              <Field label="Personas" id="guestsCount">
                <Input
                  id="guestsCount"
                  name="guestsCount"
                  type="number"
                  min="1"
                  defaultValue={reservation.raw.guestsCount}
                />
              </Field>
              <Field label="Tarifa noche" id="nightlyRate">
                <Input
                  id="nightlyRate"
                  name="nightlyRate"
                  type="number"
                  min="0"
                  defaultValue={reservation.raw.nightlyRate}
                />
              </Field>
              <Field label="Limpieza" id="cleaningFee">
                <Input
                  id="cleaningFee"
                  name="cleaningFee"
                  type="number"
                  min="0"
                  defaultValue={reservation.raw.cleaningFee}
                />
              </Field>
              <Field label="Tasas" id="taxesAmount">
                <Input
                  id="taxesAmount"
                  name="taxesAmount"
                  type="number"
                  min="0"
                  defaultValue={reservation.raw.taxesAmount}
                />
              </Field>
              <Field label="Deposito" id="securityDeposit">
                <Input
                  id="securityDeposit"
                  name="securityDeposit"
                  type="number"
                  min="0"
                  defaultValue={reservation.raw.securityDeposit}
                />
              </Field>
            </div>

            <Field label="Notas internas" id="notes">
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                defaultValue={
                  reservation.notes === "Sin notas internas."
                    ? ""
                    : reservation.notes
                }
              />
            </Field>

            <div className="flex justify-end">
              <Button type="submit" className="rounded-full">
                Guardar reserva
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Field({
  children,
  id,
  label,
}: {
  children: ReactNode;
  id: string;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
