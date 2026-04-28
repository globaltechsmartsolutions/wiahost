import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOwnerPortalData } from "@/lib/data/owners";

export const dynamic = "force-dynamic";

export default async function OwnersPage() {
  const data = await getOwnerPortalData();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Portal propietario"
        title="Liquidaciones, rendimiento y transparencia por activo."
        description="Pensado para que cada propietario vea ingresos, gastos, incidencias, ocupacion y documentos sin entrar en la operacion interna."
      />

      <section className="grid gap-4 md:grid-cols-3">
        {data.metrics.map((metric) => (
          <Card
            key={metric.label}
            className="rounded-[2rem] border-border/80 bg-card/80"
          >
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                {metric.label}
              </p>
              <p className="mt-6 text-4xl font-semibold tracking-tight">
                {metric.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {metric.helper}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Propietarios</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.owners.map((owner) => (
              <div
                key={owner.id}
                className="rounded-3xl border border-border/80 bg-background/60 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{owner.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {owner.company}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#dfd2bf] px-3 py-1 text-xs font-semibold">
                    {owner.properties} activos
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-card/80 p-3">
                    <p className="text-xs text-muted-foreground">Ingresos</p>
                    <p className="font-semibold">{owner.grossRevenue}</p>
                  </div>
                  <div className="rounded-2xl bg-card/80 p-3">
                    <p className="text-xs text-muted-foreground">Payout</p>
                    <p className="font-semibold">{owner.netPayout}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {owner.notes}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Activos del portfolio</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.assets.map((asset) => (
              <div
                key={asset.id}
                className="grid gap-3 rounded-3xl border border-border/80 bg-background/60 p-4 md:grid-cols-[1.2fr_0.7fr_0.6fr_0.6fr]"
              >
                <div>
                  <p className="font-semibold">{asset.name}</p>
                  <div className="mt-2">
                    <StatusBadge value={asset.status} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ingresos</p>
                  <p className="font-semibold">{asset.grossRevenue}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reservas</p>
                  <p className="font-semibold">{asset.activeReservations}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Incidencias</p>
                  <p className="font-semibold">{asset.incidents}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
