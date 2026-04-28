import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
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
import {
  createIncidentAction,
  updateIncidentStatusAction,
} from "@/lib/actions/operations";
import { getIncidents, getOperationFormOptions } from "@/lib/data/operations";

export const dynamic = "force-dynamic";

type IncidentsPageProps = {
  searchParams?: Promise<{
    error?: string;
    q?: string;
    severity?: string;
    status?: string;
  }>;
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

function matches(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export default async function IncidentsPage({
  searchParams,
}: IncidentsPageProps) {
  const [options, incidents, params] = await Promise.all([
    getOperationFormOptions(),
    getIncidents(),
    searchParams,
  ]);
  const filters = {
    q: params?.q?.trim() ?? "",
    severity: params?.severity?.trim() ?? "",
    status: params?.status?.trim() ?? "",
  };
  const filteredIncidents = incidents.filter((incident) => {
    const text = `${incident.title} ${incident.property} ${incident.cost}`;
    return (
      (!filters.q || matches(text, filters.q)) &&
      (!filters.status || incident.status === filters.status) &&
      (!filters.severity || incident.severity === filters.severity)
    );
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Incidencias y danos"
        title="Seguimiento de problemas, costes y cargos al huesped."
        description="Documenta danos, adjunta contexto operativo, coordina mantenimiento y decide si se reclama al canal."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}

      <Card className="mb-5 rounded-[1.6rem] border-border/80 bg-card/80">
        <CardContent className="p-4">
          <form className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto] lg:items-end">
            <div className="grid gap-2">
              <Label htmlFor="incidentSearch">Buscar</Label>
              <Input
                id="incidentSearch"
                name="q"
                defaultValue={filters.q}
                placeholder="Titulo, propiedad o coste"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="incidentStatus">Estado</Label>
              <select
                id="incidentStatus"
                name="status"
                defaultValue={filters.status}
                className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Todos</option>
                {incidentStatuses.map((status) => (
                  <option key={status.label} value={status.label}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="incidentSeverity">Severidad</Label>
              <select
                id="incidentSeverity"
                name="severity"
                defaultValue={filters.severity}
                className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Todas</option>
                {severities.map((severity) => (
                  <option key={severity.label} value={severity.label}>
                    {severity.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="rounded-full">
                Filtrar
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/incidents">Limpiar</Link>
              </Button>
            </div>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Mostrando {filteredIncidents.length} de {incidents.length} incidencias.
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.4fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Nueva incidencia</CardTitle>
            <CardDescription>
              Registra el problema mientras ocurre para no perder evidencia ni
              contexto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createIncidentAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="propertyId">Propiedad</Label>
                <select
                  id="propertyId"
                  name="propertyId"
                  required
                  className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {options.properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reservationId">Reserva relacionada</Label>
                <select
                  id="reservationId"
                  name="reservationId"
                  className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Sin reserva concreta</option>
                  {options.reservations.map((reservation) => (
                    <option key={reservation.id} value={reservation.id}>
                      {reservation.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Titulo</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="Ej. Danos en cerradura inteligente"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="severity">Severidad</Label>
                  <select
                    id="severity"
                    name="severity"
                    className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    {severities.map((severity) => (
                      <option key={severity.value} value={severity.value}>
                        {severity.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estimatedCost">Coste estimado</Label>
                  <Input
                    id="estimatedCost"
                    name="estimatedCost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="90"
                  />
                </div>
              </div>

              <Textarea
                name="description"
                required
                placeholder="Describe que ha pasado, impacto, fotos pendientes y proximo paso."
              />
              <Button type="submit" className="rounded-full">
                Crear incidencia
              </Button>
            </form>
          </CardContent>
        </Card>

        {filteredIncidents.length ? (
          <section className="grid gap-4 md:grid-cols-2">
            {filteredIncidents.map((incident) => (
              <Card
                key={incident.id}
                className="rounded-[2rem] border-border/80 bg-card/80"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">
                        {incident.title}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {incident.property}
                      </p>
                    </div>
                    <StatusBadge value={incident.status} />
                  </div>
                  <div className="mt-8 flex items-center justify-between rounded-3xl bg-background/70 p-4">
                    <StatusBadge value={incident.severity} />
                    <p className="font-semibold">{incident.cost}</p>
                  </div>
                  <form
                    action={updateIncidentStatusAction}
                    className="mt-4 flex gap-2"
                  >
                    <input
                      type="hidden"
                      name="incidentId"
                      value={incident.id}
                    />
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                    >
                      <Link href={`/incidents/${incident.id}`}>Detalle</Link>
                    </Button>
                    <select
                      aria-label={`Cambiar estado de incidencia ${incident.title}`}
                      name="status"
                      className="h-8 flex-1 rounded-xl border border-input bg-background px-2 text-xs"
                    >
                      {incidentStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                    >
                      Actualizar
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </section>
        ) : (
          <EmptyState
            title={incidents.length ? "Sin incidencias para esos filtros" : "No hay incidencias abiertas"}
            description={
              incidents.length
                ? "Prueba a limpiar filtros o buscar por otra severidad o estado."
                : "Los danos, problemas tecnicos y reclamaciones apareceran aqui."
            }
          />
        )}
      </section>
    </AppShell>
  );
}
