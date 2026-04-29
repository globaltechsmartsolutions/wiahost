import {
  createWorkflowAction,
  deleteWorkflowAction,
  updateWorkflowAction,
} from "@/lib/actions/workflows";
import {
  getGuestWorkflows,
  workflowChannelOptions,
  workflowStages,
  workflowTemplateVariables,
  workflowTriggerOptions,
  type GuestWorkflow,
} from "@/lib/data/workflows";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
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
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

type WorkflowsPageProps = {
  searchParams?: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
    updated?: string;
  }>;
};

export default async function WorkflowsPage({
  searchParams,
}: WorkflowsPageProps) {
  const [workflows, params] = await Promise.all([
    getGuestWorkflows(),
    searchParams,
  ]);
  const activeWorkflows = workflows.filter((workflow) => workflow.raw.enabled);
  const coveredTriggers = new Set(
    workflows.map((workflow) => workflow.raw.trigger),
  );
  const uncoveredStages = workflowStages.filter(
    (stage) => !coveredTriggers.has(stage.trigger),
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Operacion del huesped"
        title="Flujos de check-in y check-out listos para operar."
        description="Gestiona plantillas reutilizables para confirmacion, llegada, acceso y salida. Son workflows explicables: el equipo mantiene control y las automatizaciones futuras se apoyan en reglas claras."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}
      {params?.created ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Workflow creado correctamente.
        </div>
      ) : null}
      {params?.updated ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Workflow actualizado correctamente.
        </div>
      ) : null}
      {params?.deleted ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Workflow eliminado correctamente.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Workflows" value={String(workflows.length)} />
        <MetricCard label="Activos" value={String(activeWorkflows.length)} />
        <MetricCard
          label="Etapas cubiertas"
          value={`${coveredTriggers.size}/${workflowStages.length}`}
        />
        <MetricCard label="Pendientes" value={String(uncoveredStages.length)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {workflowStages.map((stage) => {
          const isCovered = coveredTriggers.has(stage.trigger);

          return (
            <Card
              key={stage.trigger}
              className="rounded-[1.6rem] border-border/80 bg-card/80"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{stage.label}</p>
                  <Badge
                    variant="outline"
                    className={
                      isCovered
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-amber-200 bg-amber-50 text-amber-800"
                    }
                  >
                    {isCovered ? "Cubierto" : "Pendiente"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {stage.description}
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Canal sugerido: {stage.recommendedChannel}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]">
        <div className="grid gap-5">
          <Card className="rounded-[2rem] border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>Nuevo workflow</CardTitle>
              <CardDescription>
                Crea una plantilla para una etapa concreta del viaje del
                huesped.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createWorkflowAction} className="grid gap-4">
                <WorkflowFields />
                <Button type="submit" className="rounded-full">
                  Crear workflow
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>Variables disponibles</CardTitle>
              <CardDescription>
                Usa placeholders para personalizar mensajes sin copiar y pegar
                manualmente.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {workflowTemplateVariables.map((variable) => (
                <Badge
                  key={variable}
                  variant="outline"
                  className="border-[#dfd2bf] bg-white/70 font-mono"
                >
                  {variable}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-4">
          {workflows.length ? (
            workflows.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))
          ) : (
            <EmptyState
              title="Todavia no hay workflows"
              description="Crea el primer flujo para estandarizar llegada, acceso y salida."
            />
          )}
        </section>
      </section>
    </AppShell>
  );
}

function WorkflowCard({ workflow }: { workflow: GuestWorkflow }) {
  return (
    <Card className="rounded-[2rem] border-border/80 bg-card/80">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{workflow.name}</CardTitle>
            <CardDescription>
              {workflow.phase} - {workflow.channel} - {workflow.impact}
            </CardDescription>
          </div>
          <StatusBadge value={workflow.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-2xl border border-[#dfd2bf] bg-white/55 p-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {workflow.recommendation}
          </p>
          <div className="mt-4 rounded-2xl bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Preview con datos demo
            </p>
            <p className="mt-3 text-sm leading-6 text-foreground">
              {workflow.templatePreview}
            </p>
            {workflow.missingVariables.length ? (
              <p className="mt-3 text-xs text-amber-700">
                Variables pendientes: {workflow.missingVariables.join(", ")}
              </p>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {workflow.variables.map((variable) => (
              <Badge
                key={variable}
                variant="outline"
                className="border-[#dfd2bf] bg-white/70 font-mono"
              >
                {variable}
              </Badge>
            ))}
          </div>
        </div>

        <form action={updateWorkflowAction} className="grid gap-4">
          <input type="hidden" name="workflowId" value={workflow.id} />
          <WorkflowFields fieldPrefix={workflow.id} workflow={workflow.raw} />
          <div className="flex justify-end">
            <Button type="submit" className="rounded-full">
              Guardar workflow
            </Button>
          </div>
        </form>

        <form action={deleteWorkflowAction}>
          <input type="hidden" name="workflowId" value={workflow.id} />
          <Button
            type="submit"
            variant="outline"
            className="rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            Eliminar workflow
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function WorkflowFields({
  fieldPrefix,
  workflow,
}: {
  fieldPrefix?: string;
  workflow?: GuestWorkflow["raw"];
}) {
  const prefix = fieldPrefix ? `${fieldPrefix}-` : "";

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre" id={`${prefix}name`}>
          <Input
            id={`${prefix}name`}
            name="name"
            required
            defaultValue={workflow?.name ?? ""}
            placeholder="Enviar instrucciones 24h antes"
          />
        </Field>
        <Field label="Etapa" id={`${prefix}trigger`}>
          <select
            id={`${prefix}trigger`}
            name="trigger"
            required
            defaultValue={workflow?.trigger ?? "checkin_24h"}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {workflowTriggerOptions.map((trigger) => (
              <option key={trigger.value} value={trigger.value}>
                {trigger.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Canal" id={`${prefix}channel`}>
          <select
            id={`${prefix}channel`}
            name="channel"
            required
            defaultValue={workflow?.channel ?? "whatsapp"}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {workflowChannelOptions.map((channel) => (
              <option key={channel.value} value={channel.value}>
                {channel.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Retraso en minutos" id={`${prefix}delayMinutes`}>
          <Input
            id={`${prefix}delayMinutes`}
            name="delayMinutes"
            type="number"
            min="0"
            max="10080"
            defaultValue={workflow?.delayMinutes ?? 0}
          />
        </Field>
      </div>
      <Field label="Plantilla" id={`${prefix}template`}>
        <Textarea
          id={`${prefix}template`}
          name="template"
          rows={6}
          required
          defaultValue={workflow?.template ?? ""}
          placeholder="Hola {{guest_name}}, aqui tienes las instrucciones para tu llegada a {{property_name}}..."
        />
      </Field>
      <label className="flex items-center gap-3 rounded-2xl bg-background/70 px-4 py-3 text-sm font-medium">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={workflow?.enabled ?? true}
          className="size-4 accent-[#160f09]"
        />
        Workflow activo
      </label>
    </>
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
