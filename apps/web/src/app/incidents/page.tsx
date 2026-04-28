import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { incidents } from "@/lib/demo-data";

export default function IncidentsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Incidencias y daños"
        title="Seguimiento de problemas, costes y cargos al huésped."
        description="Base para documentar daños, adjuntar evidencias, coordinar mantenimiento y decidir si se descuenta depósito o se reclama al canal."
      />
      <section className="grid gap-4 md:grid-cols-2">
        {incidents.map((incident) => (
          <Card key={incident.title} className="rounded-[2rem] border-border/80 bg-card/80">
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
    </AppShell>
  );
}
