import {
  createPricingObservationAction,
  deletePricingObservationAction,
  updatePricingObservationAction,
} from "@/lib/actions/pricing";
import { getOperationFormOptions } from "@/lib/data/operations";
import {
  conversionStatusOptions,
  getPricingObservations,
  type PricingObservationItem,
} from "@/lib/data/pricing";
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

export const dynamic = "force-dynamic";

type PricingPageProps = {
  searchParams?: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
    updated?: string;
  }>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const [observations, options, params] = await Promise.all([
    getPricingObservations(),
    getOperationFormOptions(),
    searchParams,
  ]);
  const booked = observations.filter(
    (observation) => observation.raw.conversionStatus === "booked",
  ).length;
  const avgSuggested =
    observations.reduce(
      (sum, observation) => sum + (observation.raw.suggestedPrice ?? 0),
      0,
    ) / Math.max(1, observations.length);
  const avgOccupancy =
    observations.reduce(
      (sum, observation) => sum + (observation.raw.occupancyRate ?? 0),
      0,
    ) / Math.max(1, observations.length);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Revenue"
        title="Control de precios por canal y fecha."
        description="Registra precio actual, sugerencia, aprobacion y resultado para preparar revenue advisor, PriceLabs y automatizaciones futuras sin perder control humano."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}
      {params?.created ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Observacion de precio creada correctamente.
        </div>
      ) : null}
      {params?.updated ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Observacion de precio actualizada correctamente.
        </div>
      ) : null}
      {params?.deleted ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Observacion de precio eliminada correctamente.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Observaciones" value={String(observations.length)} />
        <MetricCard label="Reservadas" value={String(booked)} />
        <MetricCard
          label="Precio sugerido medio"
          value={`${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(avgSuggested)} EUR`}
        />
        <MetricCard
          label="Ocupacion media"
          value={`${Math.round(avgOccupancy * 100)}%`}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Nueva observacion</CardTitle>
            <CardDescription>
              Guarda una recomendacion manual o importada por canal para medir
              resultado real.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={createPricingObservationAction}
              className="grid gap-4"
            >
              <PricingFields
                properties={options.properties}
                reservations={options.reservations}
              />
              <Button type="submit" className="rounded-full">
                Crear observacion
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {observations.length ? (
            observations.map((observation) => (
              <PricingCard
                key={observation.id}
                observation={observation}
                properties={options.properties}
                reservations={options.reservations}
              />
            ))
          ) : (
            <Card className="rounded-[2rem] border-border/80 bg-card/80">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Todavia no hay observaciones de precio registradas.
              </CardContent>
            </Card>
          )}
        </section>
      </section>
    </AppShell>
  );
}

function PricingCard({
  observation,
  properties,
  reservations,
}: {
  observation: PricingObservationItem;
  properties: Array<{ helper?: string; id: string; label: string }>;
  reservations: Array<{ helper?: string; id: string; label: string }>;
}) {
  return (
    <Card className="rounded-[2rem] border-border/80 bg-card/80">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{observation.property}</CardTitle>
            <CardDescription>
              {observation.channel} - {observation.observedFor} -{" "}
              {observation.guestContext}
            </CardDescription>
          </div>
          <StatusBadge value={observation.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 rounded-2xl border border-[#dfd2bf] bg-white/55 p-4 md:grid-cols-4">
          <MiniFact label="Actual" value={observation.currentPrice} />
          <MiniFact label="Sugerido" value={observation.suggestedPrice} />
          <MiniFact label="Delta" value={observation.delta} />
          <MiniFact label="Ocupacion" value={observation.occupancy} />
        </div>

        <form action={updatePricingObservationAction} className="grid gap-4">
          <input type="hidden" name="observationId" value={observation.id} />
          <PricingFields
            fieldPrefix={observation.id}
            observation={observation.raw}
            properties={properties}
            reservations={reservations}
          />
          <div className="flex justify-end">
            <Button type="submit" className="rounded-full">
              Guardar precio
            </Button>
          </div>
        </form>

        <form action={deletePricingObservationAction}>
          <input type="hidden" name="observationId" value={observation.id} />
          <Button
            type="submit"
            variant="outline"
            className="rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            Eliminar observacion
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PricingFields({
  fieldPrefix,
  observation,
  properties,
  reservations,
}: {
  fieldPrefix?: string;
  observation?: PricingObservationItem["raw"];
  properties: Array<{ helper?: string; id: string; label: string }>;
  reservations: Array<{ helper?: string; id: string; label: string }>;
}) {
  const prefix = fieldPrefix ? `${fieldPrefix}-` : "";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Propiedad" id={`${prefix}propertyId`}>
        <SelectField
          id={`${prefix}propertyId`}
          name="propertyId"
          options={properties}
          placeholder="Selecciona propiedad"
          value={observation?.propertyId}
        />
      </Field>
      <Field label="Reserva opcional" id={`${prefix}reservationId`}>
        <SelectField
          id={`${prefix}reservationId`}
          name="reservationId"
          options={reservations}
          placeholder="Sin reserva vinculada"
          value={observation?.reservationId}
        />
      </Field>
      <Field label="Fecha" id={`${prefix}observedFor`}>
        <Input
          id={`${prefix}observedFor`}
          name="observedFor"
          type="date"
          required
          defaultValue={
            observation?.observedFor ?? new Date().toISOString().slice(0, 10)
          }
        />
      </Field>
      <Field label="Canal / origen" id={`${prefix}source`}>
        <Input
          id={`${prefix}source`}
          name="source"
          required
          defaultValue={observation?.source ?? "manual"}
          placeholder="airbnb, booking, pricelabs..."
        />
      </Field>
      <Field label="Precio actual" id={`${prefix}currentPrice`}>
        <NumberInput
          id={`${prefix}currentPrice`}
          name="currentPrice"
          value={observation?.currentPrice}
        />
      </Field>
      <Field label="Precio sugerido" id={`${prefix}suggestedPrice`}>
        <NumberInput
          id={`${prefix}suggestedPrice`}
          name="suggestedPrice"
          value={observation?.suggestedPrice}
        />
      </Field>
      <Field label="Precio aprobado" id={`${prefix}approvedPrice`}>
        <NumberInput
          id={`${prefix}approvedPrice`}
          name="approvedPrice"
          value={observation?.approvedPrice}
        />
      </Field>
      <Field label="Precio final" id={`${prefix}finalPrice`}>
        <NumberInput
          id={`${prefix}finalPrice`}
          name="finalPrice"
          value={observation?.finalPrice}
        />
      </Field>
      <Field label="Moneda" id={`${prefix}currency`}>
        <Input
          id={`${prefix}currency`}
          name="currency"
          maxLength={3}
          required
          defaultValue={observation?.currency ?? "EUR"}
        />
      </Field>
      <Field label="Estado conversion" id={`${prefix}conversionStatus`}>
        <select
          id={`${prefix}conversionStatus`}
          name="conversionStatus"
          defaultValue={observation?.conversionStatus ?? "unknown"}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
        >
          {conversionStatusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Ocupacion 0-1" id={`${prefix}occupancyRate`}>
        <NumberInput
          id={`${prefix}occupancyRate`}
          max="1"
          name="occupancyRate"
          step="0.01"
          value={observation?.occupancyRate}
        />
      </Field>
      <Field label="Lead time dias" id={`${prefix}leadTimeDays`}>
        <NumberInput
          id={`${prefix}leadTimeDays`}
          name="leadTimeDays"
          step="1"
          value={observation?.leadTimeDays}
        />
      </Field>
    </div>
  );
}

function NumberInput({
  id,
  max,
  name,
  step = "1",
  value,
}: {
  id: string;
  max?: string;
  name: string;
  step?: string;
  value?: number;
}) {
  return (
    <Input
      id={id}
      max={max}
      min="0"
      name={name}
      step={step}
      type="number"
      defaultValue={value ?? ""}
    />
  );
}

function SelectField({
  id,
  name,
  options,
  placeholder,
  value,
}: {
  id: string;
  name: string;
  options: Array<{ helper?: string; id: string; label: string }>;
  placeholder: string;
  value?: string;
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={value ?? ""}
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

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
