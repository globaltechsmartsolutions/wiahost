import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteAuditEventAction } from "@/lib/actions/audit-events";
import { getAuditEventDetail } from "@/lib/data/audit-events";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

type AuditEventDetailPageProps = {
  params: Promise<{ eventId: string }>;
};

export default async function AuditEventDetailPage({
  params,
}: AuditEventDetailPageProps) {
  const { eventId } = await params;
  const event = await getAuditEventDetail(eventId);

  if (!event) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Auditoria"
        title={event.title}
        description="Detalle completo del evento operativo para soporte, trazabilidad, debugging y datasets futuros."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Badge variant="outline" className="rounded-full bg-card/70">
          {event.source}
        </Badge>
        <Badge className="rounded-full bg-[#d8ff74] text-[#160f09]">
          {event.actorType}
        </Badge>
        <Badge variant="outline" className="rounded-full bg-white/70">
          {event.entity}
        </Badge>
      </div>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Contexto</CardTitle>
            <CardDescription>
              Relacion principal del evento dentro de la operacion.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <InfoBlock label="Contexto" value={event.context} />
            <InfoBlock label="Actor" value={event.actor} />
            <InfoBlock label="Fecha" value={event.occurredAt} />
            <InfoBlock label="Entidad" value={event.entity} />
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Referencias tecnicas</CardTitle>
            <CardDescription>
              IDs vinculados para soporte y futuras automatizaciones.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <InfoBlock label="Evento" value={event.id} />
            <InfoBlock label="Entity ID" value={event.raw.entityId ?? "-"} />
            <InfoBlock
              label="Property ID"
              value={event.raw.propertyId ?? "-"}
            />
            <InfoBlock
              label="Reservation ID"
              value={event.raw.reservationId ?? "-"}
            />
            <InfoBlock label="Task ID" value={event.raw.taskId ?? "-"} />
            <InfoBlock
              label="Incident ID"
              value={event.raw.incidentId ?? "-"}
            />
          </CardContent>
        </Card>
      </section>

      <Card className="mt-5 rounded-[2rem] border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
          <CardDescription>
            Payload guardado con el evento. No debe contener secretos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[26rem] overflow-auto rounded-3xl border border-[#dfd2bf] bg-[#160f09] p-5 text-xs leading-6 text-[#f6efe4]">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <div className="mt-5 flex flex-wrap justify-between gap-3">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/audit">Volver a auditoria</Link>
        </Button>
        <form action={deleteAuditEventAction}>
          <input type="hidden" name="eventId" value={event.id} />
          <Button type="submit" variant="destructive" className="rounded-full">
            Eliminar evento
          </Button>
        </form>
      </div>
    </AppShell>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#dfd2bf] bg-white/55 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 truncate font-medium" title={value}>
        {value}
      </p>
    </div>
  );
}
