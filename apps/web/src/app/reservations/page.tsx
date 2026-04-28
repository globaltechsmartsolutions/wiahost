import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { reservations } from "@/lib/demo-data";

export default function ReservationsPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Reservas"
        title="Pipeline desde consulta hasta check-out."
        description="Vista pensada para validar estado, canal, importe, huésped y acciones necesarias antes de la llegada."
      />
      <Card className="rounded-[2rem] border-border/80 bg-card/80">
        <CardContent className="divide-y divide-border p-0">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="grid gap-4 p-5 md:grid-cols-[1.1fr_1fr_0.7fr_0.7fr] md:items-center">
              <div>
                <p className="font-semibold">{reservation.guest}</p>
                <p className="text-sm text-muted-foreground">{reservation.property}</p>
              </div>
              <p className="text-sm">{reservation.dates}</p>
              <StatusBadge value={reservation.status} />
              <p className="text-right text-xl font-semibold md:text-left">{reservation.amount}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
