import {
  createOwnerStatementAction,
  deleteOwnerStatementAction,
  updateOwnerStatementAction,
} from "@/lib/actions/owner-statements";
import {
  getOwnerStatementFormOptions,
  getOwnerStatements,
  ownerStatementStatusOptions,
  type OwnerStatementFormOptions,
  type OwnerStatementListItem,
} from "@/lib/data/owner-statements";
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
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

type StatementsPageProps = {
  searchParams?: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
    updated?: string;
  }>;
};

export default async function StatementsPage({
  searchParams,
}: StatementsPageProps) {
  const [statements, options, params] = await Promise.all([
    getOwnerStatements(),
    getOwnerStatementFormOptions(),
    searchParams,
  ]);
  const totalPayout = statements.reduce(
    (total, statement) => total + statement.raw.netPayout,
    0,
  );
  const pending = statements.filter(
    (statement) => statement.raw.status === "pending",
  ).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Liquidaciones"
        title="Liquidaciones y payout por periodo."
        description="Prepara liquidaciones mensuales por propietario, portfolio o activo, con ingresos, costes, fees y neto a pagar."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}
      {params?.created ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Liquidacion creada correctamente.
        </div>
      ) : null}
      {params?.updated ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Liquidacion actualizada correctamente.
        </div>
      ) : null}
      {params?.deleted ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Liquidacion eliminada correctamente.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Liquidaciones" value={String(statements.length)} />
        <MetricCard label="Pendientes" value={String(pending)} />
        <MetricCard
          label="Payout"
          value={`${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(totalPayout)} EUR`}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Nueva liquidacion</CardTitle>
            <CardDescription>
              Crea un statement por propietario y periodo antes de automatizar
              reportes PDF o pagos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createOwnerStatementAction} className="grid gap-4">
              <StatementFields options={options} />
              <Button type="submit" className="rounded-full">
                Crear liquidacion
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {statements.length ? (
            statements.map((statement) => (
              <StatementCard
                key={statement.id}
                options={options}
                statement={statement}
              />
            ))
          ) : (
            <EmptyState
              title="Todavia no hay liquidaciones"
              description="Crea la primera liquidacion para preparar el flujo de propietario."
            />
          )}
        </section>
      </section>
    </AppShell>
  );
}

function StatementCard({
  options,
  statement,
}: {
  options: OwnerStatementFormOptions;
  statement: OwnerStatementListItem;
}) {
  return (
    <Card className="rounded-[2rem] border-border/80 bg-card/80">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{statement.owner}</CardTitle>
            <CardDescription>
              {statement.property} - {statement.period}
            </CardDescription>
          </div>
          <StatusBadge value={statement.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          <InfoBlock label="Ingresos" value={statement.grossRevenue} />
          <InfoBlock label="Costes" value={statement.costs} />
          <InfoBlock label="Payout neto" value={statement.netPayout} />
        </div>
        <form action={updateOwnerStatementAction} className="grid gap-4">
          <input type="hidden" name="statementId" value={statement.id} />
          <StatementFields
            fieldPrefix={statement.id}
            options={options}
            statement={statement.raw}
          />
          <div className="flex justify-end">
            <Button type="submit" className="rounded-full">
              Guardar liquidacion
            </Button>
          </div>
        </form>
        <form action={deleteOwnerStatementAction}>
          <input type="hidden" name="statementId" value={statement.id} />
          <Button
            type="submit"
            variant="outline"
            className="rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            Eliminar liquidacion
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function StatementFields({
  fieldPrefix,
  options,
  statement,
}: {
  fieldPrefix?: string;
  options: OwnerStatementFormOptions;
  statement?: OwnerStatementListItem["raw"];
}) {
  const prefix = fieldPrefix ? `${fieldPrefix}-` : "";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field id={`${prefix}ownerAccountId`} label="Propietario">
        <SelectField
          id={`${prefix}ownerAccountId`}
          name="ownerAccountId"
          options={options.owners}
          required
          value={statement?.ownerAccountId ?? options.owners[0]?.id}
        />
      </Field>
      <Field id={`${prefix}propertyId`} label="Propiedad">
        <SelectField
          id={`${prefix}propertyId`}
          name="propertyId"
          options={options.properties}
          placeholder="Portfolio completo"
          value={statement?.propertyId}
        />
      </Field>
      <Field id={`${prefix}periodStart`} label="Inicio periodo">
        <Input
          id={`${prefix}periodStart`}
          name="periodStart"
          type="date"
          required
          defaultValue={statement?.periodStart ?? "2026-04-01"}
        />
      </Field>
      <Field id={`${prefix}periodEnd`} label="Fin periodo">
        <Input
          id={`${prefix}periodEnd`}
          name="periodEnd"
          type="date"
          required
          defaultValue={statement?.periodEnd ?? "2026-04-30"}
        />
      </Field>
      <Field id={`${prefix}grossRevenue`} label="Ingresos brutos">
        <Input
          id={`${prefix}grossRevenue`}
          name="grossRevenue"
          min="0"
          required
          type="number"
          defaultValue={statement?.grossRevenue ?? 0}
        />
      </Field>
      <Field id={`${prefix}platformFees`} label="Comisiones">
        <Input
          id={`${prefix}platformFees`}
          name="platformFees"
          min="0"
          type="number"
          defaultValue={statement?.platformFees ?? 0}
        />
      </Field>
      <Field id={`${prefix}cleaningCosts`} label="Costes limpieza">
        <Input
          id={`${prefix}cleaningCosts`}
          name="cleaningCosts"
          min="0"
          type="number"
          defaultValue={statement?.cleaningCosts ?? 0}
        />
      </Field>
      <Field id={`${prefix}maintenanceCosts`} label="Mantenimiento">
        <Input
          id={`${prefix}maintenanceCosts`}
          name="maintenanceCosts"
          min="0"
          type="number"
          defaultValue={statement?.maintenanceCosts ?? 0}
        />
      </Field>
      <Field id={`${prefix}netPayout`} label="Payout neto">
        <Input
          id={`${prefix}netPayout`}
          name="netPayout"
          required
          type="number"
          defaultValue={statement?.netPayout ?? 0}
        />
      </Field>
      <Field id={`${prefix}status`} label="Estado">
        <select
          id={`${prefix}status`}
          name="status"
          defaultValue={statement?.status ?? "pending"}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
        >
          {ownerStatementStatusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function SelectField({
  id,
  name,
  options,
  placeholder,
  required,
  value,
}: {
  id: string;
  name: string;
  options: Array<{ helper?: string; id: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  value?: string;
}) {
  return (
    <select
      id={id}
      name={name}
      required={required}
      defaultValue={value ?? ""}
      className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
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
