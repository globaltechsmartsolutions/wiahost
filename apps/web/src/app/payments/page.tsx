import {
  createPaymentCheckoutLinkAction,
  createPaymentAction,
  deletePaymentAction,
  updatePaymentAction,
} from "@/lib/actions/payments";
import { getOperationFormOptions } from "@/lib/data/operations";
import { getPayments, paymentStatusOptions } from "@/lib/data/payments";
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

type PaymentsPageProps = {
  searchParams?: Promise<{
    checkout?: string;
    created?: string;
    deleted?: string;
    error?: string;
    updated?: string;
  }>;
};

export default async function PaymentsPage({
  searchParams,
}: PaymentsPageProps) {
  const [payments, options, params] = await Promise.all([
    getPayments(),
    getOperationFormOptions(),
    searchParams,
  ]);
  const total = payments.reduce((sum, payment) => sum + payment.raw.amount, 0);
  const paid = payments.filter(
    (payment) => payment.raw.status === "paid",
  ).length;
  const checkoutLinks = payments.filter(
    (payment) => payment.checkoutUrl,
  ).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Pagos"
        title="Control financiero inicial por reserva."
        description="Registra pagos manuales, autorizaciones, reembolsos y disputas antes de integrar Stripe o pasarelas externas."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}
      {params?.created ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Pago creado correctamente.
        </div>
      ) : null}
      {params?.checkout ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Enlace de cobro generado correctamente.
        </div>
      ) : null}
      {params?.updated ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Pago actualizado correctamente.
        </div>
      ) : null}
      {params?.deleted ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Pago eliminado correctamente.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Pagos" value={String(payments.length)} />
        <MetricCard label="Pagados" value={String(paid)} />
        <MetricCard label="Links de cobro" value={String(checkoutLinks)} />
        <MetricCard
          label="Importe"
          value={`${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(total)} EUR`}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Nuevo pago</CardTitle>
            <CardDescription>
              Vincula un pago a una reserva y deja trazabilidad operativa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createPaymentAction} className="grid gap-4">
              <PaymentFields reservations={options.reservations} />
              <Button type="submit" className="rounded-full">
                Crear pago
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {payments.length ? (
            payments.map((payment) => (
              <Card
                key={payment.id}
                className="rounded-[2rem] border-border/80 bg-card/80"
              >
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>{payment.amount}</CardTitle>
                      <CardDescription>
                        {payment.guest} - {payment.property} - {payment.dates}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <StatusBadge value={payment.status} />
                      <StatusBadge value={payment.checkoutStatus} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <form action={updatePaymentAction} className="grid gap-4">
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <PaymentFields
                      fieldPrefix={payment.id}
                      payment={payment.raw}
                      reservations={options.reservations}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" className="rounded-full">
                        Guardar pago
                      </Button>
                    </div>
                  </form>
                  <form action={deletePaymentAction}>
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <Button
                      type="submit"
                      variant="outline"
                      className="rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                    >
                      Eliminar pago
                    </Button>
                  </form>
                  <div className="flex flex-wrap gap-3">
                    <form action={createPaymentCheckoutLinkAction}>
                      <input
                        type="hidden"
                        name="paymentId"
                        value={payment.id}
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        className="rounded-full"
                      >
                        Generar enlace de cobro
                      </Button>
                    </form>
                    {payment.checkoutUrl ? (
                      <Button asChild className="rounded-full">
                        <a
                          href={payment.checkoutUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Abrir checkout
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  {payment.checkoutUrl ? (
                    <div className="rounded-2xl border border-[#dfd2bf] bg-white/60 p-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        Checkout:
                      </span>{" "}
                      {payment.checkoutUrl}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="rounded-[2rem] border-border/80 bg-card/80">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Todavia no hay pagos registrados.
              </CardContent>
            </Card>
          )}
        </section>
      </section>
    </AppShell>
  );
}

function PaymentFields({
  fieldPrefix,
  payment,
  reservations,
}: {
  fieldPrefix?: string;
  payment?: {
    amount: number;
    currency: string;
    paidAt: string;
    provider: string;
    reservationId: string;
    status: string;
  };
  reservations: Array<{ id: string; label: string; helper?: string }>;
}) {
  const prefix = fieldPrefix ? `${fieldPrefix}-` : "";

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Reserva" id={`${prefix}reservationId`}>
          <select
            id={`${prefix}reservationId`}
            name="reservationId"
            required
            defaultValue={payment?.reservationId ?? reservations[0]?.id}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {reservations.map((reservation) => (
              <option key={reservation.id} value={reservation.id}>
                {reservation.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estado" id={`${prefix}status`}>
          <select
            id={`${prefix}status`}
            name="status"
            defaultValue={payment?.status ?? "pending"}
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            {paymentStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Proveedor" id={`${prefix}provider`}>
          <Input
            id={`${prefix}provider`}
            name="provider"
            required
            defaultValue={payment?.provider ?? "manual"}
          />
        </Field>
        <Field label="Importe" id={`${prefix}amount`}>
          <Input
            id={`${prefix}amount`}
            name="amount"
            type="number"
            min="0"
            required
            defaultValue={payment?.amount ?? 0}
          />
        </Field>
        <Field label="Moneda" id={`${prefix}currency`}>
          <Input
            id={`${prefix}currency`}
            name="currency"
            maxLength={3}
            required
            defaultValue={payment?.currency ?? "EUR"}
          />
        </Field>
        <Field label="Fecha de pago" id={`${prefix}paidAt`}>
          <Input
            id={`${prefix}paidAt`}
            name="paidAt"
            type="datetime-local"
            defaultValue={payment?.paidAt ?? ""}
          />
        </Field>
      </div>
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
