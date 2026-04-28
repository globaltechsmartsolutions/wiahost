import { createAuditEventAction } from "@/lib/actions/audit-events";
import {
  getAuditEventFormOptions,
  getAuditEvents,
  type AuditEventFormOptions,
} from "@/lib/data/audit-events";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

type AuditPageProps = {
  searchParams?: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
  }>;
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const [events, options, params] = await Promise.all([
    getAuditEvents(),
    getAuditEventFormOptions(),
    searchParams,
  ]);
  const today = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date());
  const todayEvents = events.filter((event) =>
    event.occurredAt.toLowerCase().includes(today.toLowerCase()),
  ).length;
  const sources = new Set(events.map((event) => event.source)).size;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Auditoria"
        title="Auditoria operativa de eventos."
        description="Consulta y registra actividad clave del PMS para soporte, trazabilidad, automatizaciones e IA futura con datos limpios."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}
      {params?.created ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Evento registrado correctamente.
        </div>
      ) : null}
      {params?.deleted ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Evento eliminado correctamente.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Eventos" value={String(events.length)} />
        <MetricCard label="Hoy" value={String(todayEvents)} />
        <MetricCard label="Fuentes" value={String(sources)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Registrar evento</CardTitle>
            <CardDescription>
              Util para dejar trazas manuales de soporte, cambios operativos o
              pruebas antes de automatizar el tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createAuditEventAction} className="grid gap-4">
              <AuditEventFields options={options} />
              <Button type="submit" className="rounded-full">
                Registrar evento
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {events.length ? (
            events.map((event) => (
              <Card
                key={event.id}
                className="rounded-[2rem] border-border/80 bg-card/80"
              >
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>{event.title}</CardTitle>
                      <CardDescription>
                        {event.context} - {event.occurredAt}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="border-[#dfd2bf] bg-white/70 text-[#5b4b3b]"
                      >
                        {event.source}
                      </Badge>
                      <Badge className="bg-[#d8ff74] text-[#160f09]">
                        {event.actorType}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <InfoBlock label="Entidad" value={event.entity} />
                    <InfoBlock label="Actor" value={event.actor} />
                  </div>
                  <div className="rounded-2xl border border-[#dfd2bf] bg-white/55 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Metadata
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {event.metadataSummary}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState
              title="Todavia no hay eventos"
              description="Registra el primer evento operativo para empezar a construir trazabilidad historica."
            />
          )}
        </section>
      </section>
    </AppShell>
  );
}

function AuditEventFields({ options }: { options: AuditEventFormOptions }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field id="eventName" label="Nombre del evento">
        <Input
          id="eventName"
          name="eventName"
          required
          placeholder="reservation.updated"
        />
      </Field>
      <Field id="entityType" label="Tipo de entidad">
        <Input
          id="entityType"
          name="entityType"
          required
          placeholder="reservation"
        />
      </Field>
      <Field id="source" label="Fuente">
        <Input id="source" name="source" required defaultValue="web" />
      </Field>
      <Field id="occurredAt" label="Fecha">
        <Input
          id="occurredAt"
          name="occurredAt"
          type="datetime-local"
          defaultValue={new Date().toISOString().slice(0, 16)}
        />
      </Field>
      <Field id="propertyId" label="Propiedad">
        <SelectField
          id="propertyId"
          name="propertyId"
          options={options.properties}
          placeholder="Sin propiedad"
        />
      </Field>
      <Field id="reservationId" label="Reserva">
        <SelectField
          id="reservationId"
          name="reservationId"
          options={options.reservations}
          placeholder="Sin reserva"
        />
      </Field>
      <Field id="taskId" label="Tarea">
        <SelectField
          id="taskId"
          name="taskId"
          options={options.tasks}
          placeholder="Sin tarea"
        />
      </Field>
      <Field id="incidentId" label="Incidencia">
        <SelectField
          id="incidentId"
          name="incidentId"
          options={options.incidents}
          placeholder="Sin incidencia"
        />
      </Field>
      <div className="md:col-span-2">
        <Field id="metadataNote" label="Nota de metadata">
          <Input
            id="metadataNote"
            name="metadataNote"
            placeholder="Cambio manual revisado por operaciones"
          />
        </Field>
      </div>
    </div>
  );
}

function SelectField({
  id,
  name,
  options,
  placeholder,
}: {
  id: string;
  name: string;
  options: Array<{ helper?: string; id: string; label: string }>;
  placeholder: string;
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue=""
      className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.helper ? `${option.label} - ${option.helper}` : option.label}
        </option>
      ))}
    </select>
  );
}

function Field({
  children,
  id,
  label,
}: {
  children: React.ReactNode;
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dfd2bf] bg-white/55 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-[1.6rem] border-border/80 bg-card/80">
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-5 text-3xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
