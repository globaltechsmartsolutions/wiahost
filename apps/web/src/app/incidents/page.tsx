import { EmptyState } from "@/components/empty-state";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createIncidentAction, updateIncidentStatusAction } from "@/lib/actions/operations";
import { getIncidents, getOperationFormOptions } from "@/lib/data/operations";

export const dynamic = "force-dynamic";

type IncidentsPageProps = {
  searchParams?: Promise<{ error?: string }>;
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

export default async function IncidentsPage({ searchParams }: IncidentsPageProps) {
  const [options, incidents, params] = await Promise.all([getOperationFormOptions(), getIncidents(), searchParams]);

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

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.4fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Nueva incidencia</CardTitle>
            <CardDescription>Registra el problema mientras ocurre para no perder evidencia ni contexto.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createIncidentAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="propertyId">Propiedad</Label>
                <select id="propertyId" name="propertyId" required className="h-9 rounded-xl border border-input bg-background px-3 text-sm">
                  {options.properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reservationId">Reserva relacionada</Label>
                <select id="reservationId" name="reservationId" className="h-9 rounded-xl border border-input bg-background px-3 text-sm">
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
                <Input id="title" name="title" required placeholder="Ej. Danos en cerradura inteligente" />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="severity">Severidad</Label>
                  <select id="severity" name="severity" className="h-9 rounded-xl border border-input bg-background px-3 text-sm">
                    {severities.map((severity) => (
                      <option key={severity.value} value={severity.value}>
                        {severity.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estimatedCost">Coste estimado</Label>
                  <Input id="estimatedCost" name="estimatedCost" type="number" min="0" step="0.01" placeholder="90" />
                </div>
              </div>

              <Textarea name="description" required placeholder="Describe que ha pasado, impacto, fotos pendientes y proximo paso." />
              <Button type="submit" className="rounded-full">Crear incidencia</Button>
            </form>
          </CardContent>
        </Card>

        {incidents.length ? (
          <section className="grid gap-4 md:grid-cols-2">
            {incidents.map((incident) => (
              <Card key={incident.id} className="rounded-[2rem] border-border/80 bg-card/80">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">{incident.title}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{incident.property}</p>
                    </div>
                    <StatusBadge value={incident.status} />
                  </div>
                  <div className="mt-8 flex items-center justify-between rounded-3xl bg-background/70 p-4">
                    <StatusBadge value={incident.severity} />
                    <p className="font-semibold">{incident.cost}</p>
                  </div>
                  <form action={updateIncidentStatusAction} className="mt-4 flex gap-2">
                    <input type="hidden" name="incidentId" value={incident.id} />
                    <select name="status" className="h-8 flex-1 rounded-xl border border-input bg-background px-2 text-xs">
                      {incidentStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" variant="outline" className="rounded-full">Actualizar</Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </section>
        ) : (
          <EmptyState title="No hay incidencias abiertas" description="Los danos, problemas tecnicos y reclamaciones apareceran aqui." />
        )}
      </section>
    </AppShell>
  );
}
