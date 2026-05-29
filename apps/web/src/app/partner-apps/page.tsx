import { Globe2, KeyRound, RotateCcw, ShieldCheck } from "lucide-react";

import {
  createPartnerAppAction,
  deletePartnerAppAction,
  updatePartnerAppAction,
} from "@/lib/actions/partner-apps";
import {
  getPartnerApps,
  partnerAppDefaultScopes,
  partnerAppStatusOptions,
  type PartnerAppListItem,
} from "@/lib/data/partner-apps";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/empty-state";
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

type PartnerAppsPageProps = {
  searchParams?: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
    updated?: string;
  }>;
};

export default async function PartnerAppsPage({
  searchParams,
}: PartnerAppsPageProps) {
  const [partnerApps, params] = await Promise.all([
    getPartnerApps(),
    searchParams,
  ]);
  const activeApps = partnerApps.filter(
    (app) => app.raw.status === "active",
  ).length;
  const securedApps = partnerApps.filter(
    (app) => app.keyPrefix !== "Sin clave",
  ).length;
  const webhookApps = partnerApps.filter(
    (app) => app.webhookUrl !== "Sin webhook",
  ).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Partner Website API"
        title="Webs externas conectadas a WIAHost."
        description="Gestiona partners, credenciales hasheadas, dominios permitidos y permisos para que cualquier web use WIAHost como backend operativo."
      />

      {params?.error ? (
        <Alert tone="error">{params.error}</Alert>
      ) : null}
      {params?.created ? (
        <Alert>Web conectada creada correctamente.</Alert>
      ) : null}
      {params?.updated ? (
        <Alert>Web conectada actualizada correctamente.</Alert>
      ) : null}
      {params?.deleted ? (
        <Alert>Web conectada eliminada correctamente.</Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          icon={Globe2}
          label="Webs"
          value={String(partnerApps.length)}
        />
        <MetricCard
          icon={ShieldCheck}
          label="Activas"
          value={String(activeApps)}
        />
        <MetricCard
          icon={KeyRound}
          label="Con clave"
          value={String(securedApps)}
        />
        <MetricCard
          icon={RotateCcw}
          label="Webhooks"
          value={String(webhookApps)}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Nueva web conectada</CardTitle>
            <CardDescription>
              Crea un partner app para una web externa. La clave privada se
              guarda como hash y no vuelve a mostrarse.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createPartnerAppAction} className="grid gap-4">
              <PartnerAppFields mode="create" />
              <Button type="submit" className="rounded-full">
                Crear web conectada
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {partnerApps.length ? (
            partnerApps.map((app) => (
              <PartnerAppCard key={app.id} partnerApp={app} />
            ))
          ) : (
            <EmptyState
              title="Sin webs conectadas"
              description="Crea el primer partner app para conectar una web externa a WIAHost."
            />
          )}
        </section>
      </section>
    </AppShell>
  );
}

function Alert({
  children,
  tone = "success",
}: {
  children: React.ReactNode;
  tone?: "error" | "success";
}) {
  const className =
    tone === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div className={`rounded-3xl border px-5 py-4 text-sm ${className}`}>
      {children}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Globe2;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-[1.6rem] border-border/80 bg-card/80">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-2xl bg-[#160f09] text-[#d8ff74]">
          <Icon className="size-4" />
        </span>
      </CardContent>
    </Card>
  );
}

function PartnerAppCard({
  partnerApp,
}: {
  partnerApp: PartnerAppListItem;
}) {
  return (
    <Card className="rounded-[2rem] border-border/80 bg-card/80">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {partnerApp.displayName}
              <StatusBadge value={partnerApp.status} />
            </CardTitle>
            <CardDescription>
              {partnerApp.partnerId} · clave {partnerApp.keyPrefix}
            </CardDescription>
          </div>
          <p className="rounded-full border border-[#dfd2bf] bg-white/60 px-3 py-1 text-xs text-muted-foreground">
            {partnerApp.rateLimitPerMinute}/min
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <Info label="Dominios" value={partnerApp.allowedOrigins} />
          <Info label="Retornos" value={partnerApp.redirectUrls} />
          <Info label="Scopes" value={partnerApp.scopes} />
          <Info label="Webhook" value={partnerApp.webhookUrl} />
          <Info label="Actualizada" value={partnerApp.updatedAt} />
          <Info label="Notas" value={partnerApp.notes} />
        </div>

        <form
          action={updatePartnerAppAction}
          className="grid gap-4 rounded-2xl border border-[#dfd2bf] bg-white/45 p-4"
        >
          <input name="partnerAppId" type="hidden" value={partnerApp.id} />
          <PartnerAppFields mode="edit" partnerApp={partnerApp} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="rounded-full">
              Guardar cambios
            </Button>
            <Button
              form={`delete-partner-app-${partnerApp.id}`}
              type="submit"
              variant="outline"
              className="rounded-full border-red-200 text-red-700 hover:bg-red-50"
            >
              Eliminar
            </Button>
          </div>
        </form>

        <form
          action={deletePartnerAppAction}
          id={`delete-partner-app-${partnerApp.id}`}
        >
          <input name="partnerAppId" type="hidden" value={partnerApp.id} />
        </form>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dfd2bf] bg-white/50 p-3">
      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}

function PartnerAppFields({
  mode,
  partnerApp,
}: {
  mode: "create" | "edit";
  partnerApp?: PartnerAppListItem;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field id={`${mode}-displayName`} label="Nombre">
          <Input
            id={`${mode}-displayName`}
            name="displayName"
            defaultValue={partnerApp?.raw.displayName ?? ""}
            placeholder="World Institutional Assets"
            required
          />
        </Field>
        <Field id={`${mode}-partnerId`} label="Partner ID">
          <Input
            id={`${mode}-partnerId`}
            name="partnerId"
            defaultValue={partnerApp?.raw.partnerId ?? ""}
            placeholder="worldinstitutionalassets"
            readOnly={mode === "edit"}
            required
          />
        </Field>
        <Field id={`${mode}-status`} label="Estado">
          <NativeSelect
            id={`${mode}-status`}
            name="status"
            defaultValue={partnerApp?.raw.status ?? "draft"}
            options={partnerAppStatusOptions}
          />
        </Field>
        <Field id={`${mode}-rateLimitPerMinute`} label="Límite por minuto">
          <Input
            id={`${mode}-rateLimitPerMinute`}
            min={1}
            name="rateLimitPerMinute"
            type="number"
            defaultValue={partnerApp?.raw.rateLimitPerMinute ?? 60}
          />
        </Field>
      </div>

      <Field
        id={`${mode}-apiKey`}
        label={mode === "create" ? "Clave privada" : "Rotar clave"}
      >
        <Input
          id={`${mode}-apiKey`}
          name="apiKey"
          type="password"
          placeholder={
            mode === "create"
              ? "minimo 12 caracteres"
              : "dejar vacio para conservar la actual"
          }
          required={mode === "create"}
        />
      </Field>

      <div className="grid gap-3 md:grid-cols-2">
        <Field id={`${mode}-allowedOrigins`} label="Dominios permitidos">
          <Textarea
            id={`${mode}-allowedOrigins`}
            name="allowedOrigins"
            defaultValue={partnerApp?.raw.allowedOrigins.join("\n") ?? ""}
            placeholder="https://www.ejemplo.com"
            rows={3}
          />
        </Field>
        <Field id={`${mode}-redirectUrls`} label="URLs de retorno">
          <Textarea
            id={`${mode}-redirectUrls`}
            name="redirectUrls"
            defaultValue={partnerApp?.raw.redirectUrls.join("\n") ?? ""}
            placeholder="https://www.ejemplo.com/booking"
            rows={3}
          />
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field id={`${mode}-webhookUrl`} label="Webhook">
          <Input
            id={`${mode}-webhookUrl`}
            name="webhookUrl"
            defaultValue={partnerApp?.raw.webhookUrl ?? ""}
            placeholder="https://www.ejemplo.com/api/wiahost"
          />
        </Field>
        <Field id={`${mode}-scopes`} label="Scopes">
          <Input
            id={`${mode}-scopes`}
            name="scopes"
            defaultValue={
              partnerApp?.raw.scopes.join(", ") ??
              partnerAppDefaultScopes.join(", ")
            }
          />
        </Field>
      </div>

      <Field id={`${mode}-notes`} label="Notas">
        <Textarea
          id={`${mode}-notes`}
          name="notes"
          defaultValue={partnerApp?.raw.notes ?? ""}
          placeholder="Contexto operativo, staging, responsable o restricciones."
          rows={3}
        />
      </Field>
    </div>
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
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function NativeSelect({
  defaultValue,
  id,
  name,
  options,
}: {
  defaultValue: string;
  id: string;
  name: string;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <select
      className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      defaultValue={defaultValue}
      id={id}
      name={name}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
