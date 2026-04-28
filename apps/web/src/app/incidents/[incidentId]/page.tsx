import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIncidentDetail } from "@/lib/data/operations";

export const dynamic = "force-dynamic";

type IncidentDetailPageProps = {
  params: Promise<{ incidentId: string }>;
};

export default async function IncidentDetailPage({
  params,
}: IncidentDetailPageProps) {
  const { incidentId } = await params;
  const incident = await getIncidentDetail(incidentId);

  if (!incident) {
    notFound();
  }

  return (
    <AppShell>
      <div className="mb-6">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/incidents">Volver a incidencias</Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Detalle de incidencia"
        title={incident.title}
        description={`${incident.property} - ${incident.cost}`}
      />

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.7fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Seguimiento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge value={incident.status} />
              <StatusBadge value={incident.severity} />
            </div>
            <p className="rounded-3xl bg-background/70 p-5 text-sm leading-6 text-muted-foreground">
              {incident.description}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Datos clave</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {incident.fields.map((field) => (
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
