import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock3,
  ExternalLink,
  ListChecks,
  ShieldCheck,
} from "lucide-react";

import {
  getWiaPilotPhaseLabel,
  wiaPilotLinks,
  wiaPilotMetrics,
  wiaPilotPhases,
  wiaPilotPrinciples,
  wiaPilotUpdatedAt,
  type WiaPilotPhase,
  type WiaPilotPhaseStatus,
} from "@/lib/data/wia-pilot-roadmap";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-static";

const statusStyles: Record<WiaPilotPhaseStatus, string> = {
  blocked: "border-red-200 bg-red-50 text-red-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  in_progress: "border-amber-200 bg-amber-50 text-amber-900",
  next: "border-sky-200 bg-sky-50 text-sky-800",
  planned: "border-border bg-background text-muted-foreground",
};

const statusIcons: Record<
  WiaPilotPhaseStatus,
  React.ComponentType<{ className?: string }>
> = {
  blocked: AlertTriangle,
  completed: CheckCircle2,
  in_progress: CircleDot,
  next: Clock3,
  planned: ListChecks,
};

export default function WiaRoadmapPage() {
  const completed = wiaPilotPhases.filter(
    (phase) => phase.status === "completed",
  ).length;
  const active = wiaPilotPhases.find((phase) => phase.status === "in_progress");
  const next = wiaPilotPhases.find((phase) => phase.status === "next");

  return (
    <AppShell>
      <PageHeader
        eyebrow="Piloto World Institutional Assets"
        title="Roadmap operativo de migración WIA -> WIAHost"
        description="Seguimiento local del cambio de Hostaway a WIAHost: primero web directa, después coexistencia, preproducción, producción y conectores oficiales por canal."
      />

      <section className="grid gap-4 md:grid-cols-4">
        {wiaPilotMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card className="rounded-[1.6rem] border-border/80 bg-card/80">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Estado actual</CardTitle>
                <CardDescription>
                  Última actualización local: {wiaPilotUpdatedAt}
                </CardDescription>
              </div>
              <Badge className="rounded-full border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-50">
                {completed}/{wiaPilotPhases.length} fases cerradas
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <StateBlock
                label="Fase en curso"
                value={active ? `${active.number}. ${active.title}` : "Sin fase activa"}
              />
              <StateBlock
                label="Siguiente corte"
                value={next ? `${next.number}. ${next.title}` : "Por definir"}
              />
            </div>
            <div className="rounded-2xl border border-[#dfd2bf] bg-white/55 p-4">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="size-4 text-emerald-700" />
                Regla de seguridad
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Producción sigue intacta. El piloto avanza por local,
                preproducción y producción, con rollback a Hostaway por
                variable de entorno.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.6rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Qué puedes abrir en local</CardTitle>
            <CardDescription>
              Enlaces rápidos para comprobar que cada capa responde.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {wiaPilotLinks.map((link) => (
              <a
                key={link.href}
                className="grid gap-2 rounded-2xl border border-[#dfd2bf] bg-white/55 p-4 transition hover:bg-white/80 md:grid-cols-[1fr_auto] md:items-center"
                href={link.href}
                rel="noreferrer"
                target="_blank"
              >
                <span>
                  <span className="block font-semibold">{link.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {link.description}
                  </span>
                </span>
                <ExternalLink className="size-4 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-4">
        <Card className="rounded-[1.6rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Principios de ejecución</CardTitle>
            <CardDescription>
              Esto mantiene el piloto alineado con el objetivo de construir un
              Hostaway propio, no un parche puntual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 md:grid-cols-2">
              {wiaPilotPrinciples.map((principle) => (
                <li
                  key={principle}
                  className="flex gap-3 rounded-2xl border border-[#dfd2bf] bg-white/55 p-4 text-sm leading-6"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                  <span>{principle}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-4">
        {wiaPilotPhases.map((phase) => (
          <PhaseCard key={phase.id} phase={phase} />
        ))}
      </section>
    </AppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-[1.6rem] border-border/80 bg-card/80">
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          {label}
        </p>
        <p className="mt-5 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function StateBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dfd2bf] bg-white/55 p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6">{value}</p>
    </div>
  );
}

function PhaseCard({ phase }: { phase: WiaPilotPhase }) {
  const StatusIcon = statusIcons[phase.status];

  return (
    <Card className="rounded-[1.6rem] border-border/80 bg-card/80">
      <CardHeader>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={`rounded-full border ${statusStyles[phase.status]}`}
              >
                <StatusIcon className="mr-1 size-3.5" />
                {getWiaPilotPhaseLabel(phase.status)}
              </Badge>
              <span className="text-sm font-semibold text-muted-foreground">
                Fase {phase.number}
              </span>
            </div>
            <CardTitle className="mt-3 text-xl">{phase.title}</CardTitle>
            <CardDescription className="mt-2 max-w-4xl leading-6">
              {phase.objective}
            </CardDescription>
          </div>
          <div className="rounded-2xl border border-[#dfd2bf] bg-white/55 px-4 py-3 text-sm">
            <span className="block text-xs font-semibold uppercase text-muted-foreground">
              Responsable
            </span>
            <span className="mt-1 block font-semibold">{phase.owner}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-4">
        <PhaseList title="Visible en local" items={phase.localProof} />
        <PhaseList title="Entregables" items={phase.deliverables} />
        <PhaseList title="Criterio de salida" items={phase.exitCriteria} />
        <PhaseList title="Siguientes acciones" items={phase.nextActions} />
      </CardContent>
    </Card>
  );
}

function PhaseList({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#160f09]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
