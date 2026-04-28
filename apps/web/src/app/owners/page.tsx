import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function OwnersPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Portal propietario"
        title="Liquidaciones, rendimiento y transparencia por activo."
        description="Pensado para que cada propietario vea ingresos, gastos, incidencias, ocupación y documentos sin entrar en la operación interna."
      />
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Ingresos brutos", "28.270 €", "Abril"],
          ["Costes operativos", "4.120 €", "Limpieza, fees y mantenimiento"],
          ["Payout neto", "24.150 €", "Pendiente de aprobación"],
        ].map(([label, value, helper]) => (
          <Card key={label} className="rounded-[2rem] border-border/80 bg-card/80">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">{label}</p>
              <p className="mt-6 text-4xl font-semibold tracking-tight">{value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </AppShell>
  );
}
