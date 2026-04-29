import {
  createAutomationRuleAction,
  deleteAutomationRuleAction,
  runAutomationRuleAction,
  updateAutomationRuleAction,
} from "@/lib/actions/automations";
import {
  channelOptions,
  getAutomationRunOptions,
  getAutomationRuns,
  getAutomationRules,
  triggerOptions,
  type AutomationRunListItem,
} from "@/lib/data/automations";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
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

export const dynamic = "force-dynamic";

type AutomationsPageProps = {
  searchParams?: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
    ran?: string;
    updated?: string;
  }>;
};

export default async function AutomationsPage({
  searchParams,
}: AutomationsPageProps) {
  const [rules, runs, runOptions, params] = await Promise.all([
    getAutomationRules(),
    getAutomationRuns(),
    getAutomationRunOptions(),
    searchParams,
  ]);
  const activeRules = rules.filter((rule) => rule.raw.enabled).length;
  const pausedRules = rules.length - activeRules;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Automatizaciones PMS"
        title="Reglas operativas para responder, preparar y escalar sin perder control."
        description="Configura triggers, canales, delays y plantillas. La IA futura usara estas reglas como base explicable, no como caja negra."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}
      {params?.created ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Automatizacion creada correctamente.
        </div>
      ) : null}
      {params?.updated ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Automatizacion actualizada correctamente.
        </div>
      ) : null}
      {params?.deleted ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Automatizacion eliminada correctamente.
        </div>
      ) : null}
      {params?.ran ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Prueba de automatizacion registrada correctamente.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Reglas" value={String(rules.length)} />
        <MetricCard label="Activas" value={String(activeRules)} />
        <MetricCard label="Pausadas" value={String(pausedRules)} />
        <MetricCard label="Ejecuciones" value={String(runs.length)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Nueva automatizacion</CardTitle>
            <CardDescription>
              Empieza con reglas claras: evento, canal, plantilla y retraso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createAutomationRuleAction} className="grid gap-4">
              <AutomationFields />
              <Button type="submit" className="rounded-full">
                Crear automatizacion
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {rules.length ? (
            rules.map((rule) => (
              <Card
                key={rule.id}
                className="rounded-[2rem] border-border/80 bg-card/80"
              >
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>{rule.name}</CardTitle>
                      <CardDescription>
                        {rule.trigger} - {rule.channel} - {rule.impact}
                      </CardDescription>
                    </div>
                    <StatusBadge value={rule.status} />
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <TemplatePreview
                    missingVariables={rule.missingVariables}
                    preview={rule.templatePreview}
                    variables={rule.variables}
                  />
                  <form
                    action={runAutomationRuleAction}
                    className="rounded-2xl border border-[#dfd2bf] bg-white/55 p-4"
                  >
                    <input type="hidden" name="ruleId" value={rule.id} />
                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                      <Field
                        id={`${rule.id}-reservationId`}
                        label="Probar con reserva"
                      >
                        <select
                          id={`${rule.id}-reservationId`}
                          name="reservationId"
                          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                          defaultValue=""
                        >
                          <option value="">Sin reserva vinculada</option>
                          {runOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.helper
                                ? `${option.label} - ${option.helper}`
                                : option.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Button
                        type="submit"
                        variant="outline"
                        className="rounded-full"
                      >
                        Ejecutar prueba
                      </Button>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Registra una ejecucion y un evento de auditoria sin enviar
                      mensajes reales a canales externos.
                    </p>
                  </form>
                  <form
                    action={updateAutomationRuleAction}
                    className="grid gap-4"
                  >
                    <input type="hidden" name="ruleId" value={rule.id} />
                    <AutomationFields fieldPrefix={rule.id} rule={rule.raw} />
                    <div className="flex justify-end">
                      <Button type="submit" className="rounded-full">
                        Guardar cambios
                      </Button>
                    </div>
                  </form>
                  <form action={deleteAutomationRuleAction}>
                    <input type="hidden" name="ruleId" value={rule.id} />
                    <Button
                      type="submit"
                      variant="outline"
                      className="rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                    >
                      Eliminar automatizacion
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="rounded-[2rem] border-border/80 bg-card/80">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Todavia no hay automatizaciones. Crea la primera regla para
                empezar a estandarizar la operacion.
              </CardContent>
            </Card>
          )}
        </section>
      </section>

      <AutomationRunsPanel runs={runs} />
    </AppShell>
  );
}

function AutomationRunsPanel({ runs }: { runs: AutomationRunListItem[] }) {
  return (
    <Card className="rounded-[2rem] border-border/80 bg-card/80">
      <CardHeader>
        <CardTitle>Ultimas ejecuciones</CardTitle>
        <CardDescription>
          Historial de pruebas y ejecuciones registradas en `automation_runs`.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {runs.length ? (
          runs.map((run) => (
            <div
              className="rounded-2xl border border-[#dfd2bf] bg-white/60 p-4"
              key={run.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{run.ruleName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {run.context} - {run.trigger} - {run.channel}
                  </p>
                </div>
                <StatusBadge value={run.status} />
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {run.executedAt}
              </p>
              {run.errorMessage ? (
                <p className="mt-2 text-sm text-amber-700">
                  {run.errorMessage}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#dfd2bf] bg-white/50 p-4 text-sm text-muted-foreground">
            Aun no hay ejecuciones. Ejecuta una prueba desde cualquier regla
            para validar plantilla, contexto y trazabilidad.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TemplatePreview({
  missingVariables,
  preview,
  variables,
}: {
  missingVariables: string[];
  preview: string;
  variables: string[];
}) {
  return (
    <div className="rounded-2xl border border-[#dfd2bf] bg-white/55 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Preview con datos demo
      </p>
      <p className="mt-3 text-sm leading-6 text-foreground">{preview}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(variables.length ? variables : ["Sin variables dinamicas"]).map(
          (variable) => (
            <span
              key={variable}
              className="rounded-full border border-[#dfd2bf] bg-white/70 px-2.5 py-1 font-mono text-xs"
            >
              {variable}
            </span>
          ),
        )}
      </div>
      {missingVariables.length ? (
        <p className="mt-3 text-xs text-amber-700">
          Variables pendientes: {missingVariables.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function AutomationFields({
  fieldPrefix,
  rule,
}: {
  fieldPrefix?: string;
  rule?: {
    channel: string;
    delayMinutes: number;
    enabled: boolean;
    name: string;
    template: string;
    trigger: string;
  };
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
            defaultValue={rule?.name ?? ""}
            placeholder="Enviar instrucciones 24h antes"
          />
        </Field>
        <Field label="Trigger" id={`${prefix}trigger`}>
          <select
            id={`${prefix}trigger`}
            name="trigger"
            required
            defaultValue={rule?.trigger ?? "checkin_24h"}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {triggerOptions.map((trigger) => (
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
            defaultValue={rule?.channel ?? "email"}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {channelOptions.map((channel) => (
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
            defaultValue={rule?.delayMinutes ?? 0}
          />
        </Field>
      </div>
      <Field label="Plantilla" id={`${prefix}template`}>
        <Textarea
          id={`${prefix}template`}
          name="template"
          rows={5}
          required
          defaultValue={rule?.template ?? ""}
          placeholder="Hola {{guest_name}}, aqui tienes las instrucciones para tu llegada..."
        />
      </Field>
      <label className="flex items-center gap-3 rounded-2xl bg-background/70 px-4 py-3 text-sm font-medium">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={rule?.enabled ?? true}
          className="size-4 accent-[#160f09]"
        />
        Automatizacion activa
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
