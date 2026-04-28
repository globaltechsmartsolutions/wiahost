import { EmptyState } from "@/components/empty-state";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { getIncidents } from "@/lib/data/operations";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const incidents = await getIncidents();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Incidencias y danos"
        title="Seguimiento de problemas, costes y cargos al huesped."
        description="Base para documentar danos, adjuntar evidencias, coordinar mantenimiento y decidir si se descuenta deposito o se reclama al canal."
      />

      {incidents.length ? (
        <section className="grid gap-4 md:grid-cols-2">
          {incidents.map((incident) => (
            <Card key={`${incident.title}-${incident.property}`} className="rounded-[2rem] border-border/80 bg-card/80">
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
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState title="No hay incidencias abiertas" description="Los danos, problemas tecnicos y reclamaciones apareceran aqui." />
      )}
    </AppShell>
  );
}
