import Link from "next/link";
import { ArrowRight, Inbox, Phone } from "lucide-react";

import { updateLeadStatusAction } from "@/lib/actions/leads";
import { getDirectLeads, type DirectLeadItem } from "@/lib/data/leads";
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
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

type LeadsPageProps = {
  searchParams?: Promise<{
    error?: string;
    updated?: string;
  }>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const [leads, params] = await Promise.all([getDirectLeads(), searchParams]);
  const openLeads = leads.filter((lead) =>
    ["Consulta", "Pendiente"].includes(lead.status),
  ).length;
  const confirmedLeads = leads.filter(
    (lead) => lead.status === "Confirmada",
  ).length;
  const cancelledLeads = leads.filter(
    (lead) => lead.status === "Cancelada",
  ).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Leads directos"
        title="Solicitudes web listas para responder y convertir."
        description="Todo lead que llega desde la web directa queda en una cola comercial: revisar contexto, contestar desde inbox y convertir a reserva confirmada cuando operaciones lo valide."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}
      {params?.updated ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Lead actualizado correctamente.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Leads" value={String(leads.length)} />
        <MetricCard label="Abiertos" value={String(openLeads)} />
        <MetricCard label="Confirmados" value={String(confirmedLeads)} />
        <MetricCard label="Cancelados" value={String(cancelledLeads)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          {leads.length ? (
            leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
          ) : (
            <EmptyState
              title="Todavia no hay leads directos"
              description="Cuando alguien solicite reserva desde /book/[slug], aparecera aqui."
            />
          )}
        </div>

        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Proceso recomendado</CardTitle>
            <CardDescription>
              Mantiene el control humano antes de bloquear calendario o prometer
              disponibilidad.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              "Revisar fechas, precio estimado y mensaje del huesped.",
              "Responder desde inbox para pedir datos o confirmar condiciones.",
              "Convertir a confirmada solo cuando disponibilidad y pago esten claros.",
              "Cancelar si no encaja y dejar trazabilidad para futuras automatizaciones.",
            ].map((step, index) => (
              <div
                key={step}
                className="flex gap-3 rounded-2xl border border-[#dfd2bf] bg-white/55 p-4 text-sm leading-6"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#160f09] text-xs font-semibold text-white">
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function LeadCard({ lead }: { lead: DirectLeadItem }) {
  return (
    <Card className="rounded-[2rem] border-border/80 bg-card/80">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{lead.guest}</CardTitle>
            <CardDescription>
              {lead.property} - {lead.dates} - {lead.amount}
            </CardDescription>
          </div>
          <StatusBadge value={lead.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 rounded-2xl border border-[#dfd2bf] bg-white/55 p-4 md:grid-cols-3">
          <MiniFact label="Canal" value={lead.channel} />
          <MiniFact label="Recibido" value={lead.createdAt} />
          <MiniFact label="SLA" value={lead.waiting} />
        </div>

        <div className="rounded-2xl border border-[#dfd2bf] bg-white/55 p-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {lead.message}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f6efe4] px-3 py-1">
              <Inbox className="size-3" />
              {lead.email}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f6efe4] px-3 py-1">
              <Phone className="size-3" />
              {lead.phone}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {lead.conversationId ? (
            <Button asChild className="rounded-full">
              <Link href={`/inbox/${lead.conversationId}`}>
                Responder en inbox
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button disabled className="rounded-full">
              Sin hilo de inbox
            </Button>
          )}
          <Button asChild variant="outline" className="rounded-full">
            <Link href={`/reservations/${lead.id}`}>Ver reserva</Link>
          </Button>
          <LeadStatusButton
            label="Confirmar"
            reservationId={lead.id}
            status="confirmed"
          />
          <LeadStatusButton
            label="Cancelar"
            reservationId={lead.id}
            status="cancelled"
            variant="danger"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function LeadStatusButton({
  label,
  reservationId,
  status,
  variant = "default",
}: {
  label: string;
  reservationId: string;
  status: string;
  variant?: "danger" | "default";
}) {
  return (
    <form action={updateLeadStatusAction}>
      <input type="hidden" name="reservationId" value={reservationId} />
      <input type="hidden" name="status" value={status} />
      <Button
        type="submit"
        variant="outline"
        className={
          variant === "danger"
            ? "rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            : "rounded-full"
        }
      >
        {label}
      </Button>
    </form>
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
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}
