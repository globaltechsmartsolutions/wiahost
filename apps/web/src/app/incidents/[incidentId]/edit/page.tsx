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
import { updateIncidentAction } from "@/lib/actions/operations";
import {
  getIncidentDetail,
  getOperationFormOptions,
} from "@/lib/data/operations";

type EditIncidentPageProps = {
  params: Promise<{ incidentId: string }>;
  searchParams: Promise<{ error?: string }>;
};

const severities = [
  { label: "Baja", value: "low" },
  { label: "Media", value: "medium" },
  { label: "Alta", value: "high" },
  { label: "Critica", value: "critical" },
];

const incidentStatuses = [
  { label: "Abierta", value: "open" },
  { label: "Investigando", value: "investigating" },
  { label: "Resuelta", value: "resolved" },
  { label: "Cargada", value: "charged" },
  { label: "Cancelada", value: "cancelled" },
];

export default async function EditIncidentPage({
  params,
  searchParams,
}: EditIncidentPageProps) {
  const [{ incidentId }, { error }, options] = await Promise.all([
    params,
    searchParams,
    getOperationFormOptions(),
  ]);
  const incident = await getIncidentDetail(incidentId);

  if (!incident) {
    notFound();
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          eyebrow="Incidencias"
          title={`Editar ${incident.title}`}
          description="Mantén severidad, coste, estado y contexto operativo alineados con la realidad."
        />
        <Button
          asChild
          variant="outline"
          className="rounded-full border-[#dfd2bf] bg-white/70"
        >
          <Link href={`/incidents/${incident.id}`}>Volver al detalle</Link>
        </Button>
      </div>

      <Card className="rounded-[2rem] border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Datos de la incidencia</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          <form action={updateIncidentAction} className="grid gap-5">
            <input type="hidden" name="incidentId" value={incident.id} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Propiedad" id="propertyId">
                <select
                  id="propertyId"
                  name="propertyId"
                  required
                  defaultValue={incident.raw.propertyId}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {options.properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Reserva relacionada" id="reservationId">
                <select
                  id="reservationId"
                  name="reservationId"
                  defaultValue={incident.raw.reservationId ?? ""}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Sin reserva concreta</option>
                  {options.reservations.map((reservation) => (
                    <option key={reservation.id} value={reservation.id}>
                      {reservation.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Titulo" id="title">
              <Input
                id="title"
                name="title"
                required
                defaultValue={incident.raw.title}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Severidad" id="severity">
                <select
                  id="severity"
                  name="severity"
                  defaultValue={incident.raw.severity}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {severities.map((severity) => (
                    <option key={severity.value} value={severity.value}>
                      {severity.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Estado" id="status">
                <select
                  id="status"
                  name="status"
                  defaultValue={incident.raw.status}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {incidentStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Coste estimado" id="estimatedCost">
                <Input
                  id="estimatedCost"
                  name="estimatedCost"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={incident.raw.estimatedCost ?? ""}
                />
              </Field>
            </div>

            <Field label="Descripcion" id="description">
              <Textarea
                id="description"
                name="description"
                required
                rows={6}
                defaultValue={incident.raw.description}
              />
            </Field>

            <div className="flex justify-end">
              <Button type="submit" className="rounded-full">
                Guardar incidencia
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
