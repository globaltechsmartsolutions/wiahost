import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Inbox,
  Radio,
  Sparkles,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData, type ExecutiveMetric } from "@/lib/data/operations";

export const dynamic = "force-dynamic";

function MetricTile({ metric }: { metric: ExecutiveMetric }) {
  const tone =
    metric.tone === "positive"
      ? "bg-emerald-100 text-emerald-900"
      : metric.tone === "warning"
        ? "bg-amber-100 text-amber-900"
        : "bg-[#efe3cf] text-[#3a2a18]";

  return (
    <Card className="h-full rounded-[1.7rem] border-[#dfd2bf] bg-white/72 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#75695b] 2xl:tracking-[0.24em]">{metric.label}</p>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>Live</span>
        </div>
        <p className="mt-7 text-4xl font-semibold tracking-[-0.04em]">{metric.value}</p>
        <p className="mt-2 text-sm text-[#75695b]">{metric.helper}</p>
      </CardContent>
    </Card>
  );
}

function CalendarCell({ value }: { value: string }) {
  const tone = value.includes("Check-in")
    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
    : value.includes("Check-out")
      ? "border-blue-300 bg-blue-50 text-blue-900"
      : value.includes("Bloqueo")
        ? "border-red-300 bg-red-50 text-red-900"
        : value.includes("Ocupado")
          ? "border-[#d6c4a8] bg-[#efe3cf] text-[#3a2a18]"
          : "border-[#dfd2bf] bg-white/60 text-[#75695b]";

  return (
    <div className={`min-h-[4.5rem] rounded-2xl border px-3 py-2 text-xs font-semibold leading-5 ${tone}`}>
      {value}
    </div>
  );
}

export default async function DashboardPage() {
  const {
    automationRules,
    calendarDays,
    calendarMatrix,
    channelHealth,
    executiveMetrics,
    inboxThreads,
    operationQueue,
    reservations,
    tasks,
  } = await getDashboardData();

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-[2.2rem] border border-[#dfd2bf] bg-[#160f09] p-5 text-white shadow-2xl sm:p-7">
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-[#d8ff74]/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-sm text-white/70">
              <Radio className="size-4 text-[#d8ff74]" />
              Centro de mando en tiempo real
            </div>
            <h1 className="max-w-4xl text-balance text-4xl font-semibold tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              Prioridades, reservas y canales sincronizados en una sola pantalla.
            </h1>
            <p className="mt-5 max-w-3xl text-pretty text-base leading-7 text-white/62 sm:text-lg">
              Diseñado para operar como un PMS profesional: multi-calendario, inbox priorizado, tareas,
              salud de canales, revenue y automatizaciones antes de que haya una incidencia.
            </p>
          </div>
          <div className="grid min-w-[280px] gap-3 rounded-[1.7rem] border border-white/10 bg-white/8 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Estado global</span>
              <span className="rounded-full bg-[#d8ff74] px-3 py-1 text-xs font-bold text-[#160f09]">92% healthy</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[92%] rounded-full bg-[#d8ff74]" />
            </div>
            <p className="text-xs leading-5 text-white/70">2 mensajes urgentes · 1 canal requiere revisión · 5 tareas críticas.</p>
          </div>
        </div>
      </section>

      <section
        className="mt-5 grid gap-5 md:grid-cols-6 xl:grid-cols-12"
        data-testid="dashboard-content-grid"
      >
        {executiveMetrics.map((metric) => (
          <div key={metric.label} className="md:col-span-3 xl:col-span-3">
            <MetricTile metric={metric} />
          </div>
        ))}
        <Card
          className="flex h-full overflow-hidden rounded-[2rem] border-[#dfd2bf] bg-white/74 shadow-sm md:col-span-6 xl:col-span-8"
          data-testid="dashboard-calendar-card"
        >
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#eadfce]">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CalendarDays className="size-5" />
                Multi-calendario operativo
              </CardTitle>
              <p className="mt-1 text-sm text-[#75695b]">Disponibilidad, reservas, limpiezas y bloqueos por activo.</p>
            </div>
            <Button variant="outline" className="rounded-full border-[#dfd2bf] bg-white" asChild>
              <Link href="/calendar">Abrir vista completa</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div
              aria-label="Multi-calendario operativo por propiedad"
              className="overflow-x-auto"
              role="region"
              tabIndex={0}
            >
              <div className="min-w-[920px]">
                <div className="grid grid-cols-[210px_repeat(7,1fr)] border-b border-[#eadfce] bg-[#fbf7ef]">
                  <div className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-[#75695b]">Propiedad</div>
                  {calendarDays.map((day) => (
                    <div key={day.date} className="border-l border-[#eadfce] px-3 py-4 text-center">
                      <p className="text-xs text-[#75695b]">{day.day}</p>
                      <p className="text-2xl font-semibold">{day.date}</p>
                    </div>
                  ))}
                </div>
                {calendarMatrix.map((row) => (
                  <div key={row.code} className="grid grid-cols-[210px_repeat(7,1fr)] border-b border-[#eadfce] last:border-b-0">
                    <div className="px-5 py-3.5">
                      <p className="font-semibold">{row.property}</p>
                      <p className="mt-1 font-mono text-xs text-[#75695b]">{row.code}</p>
                    </div>
                    {row.cells.map((cell, index) => (
                      <div key={`${row.code}-${calendarDays[index].date}`} className="border-l border-[#eadfce] p-1.5">
                        <CalendarCell value={cell} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eadfce] bg-[#fbf7ef] px-5 py-3">
              <div className="flex flex-wrap gap-2 text-xs font-medium text-[#75695b]">
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-emerald-800">Check-in</span>
                <span className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-blue-800">Check-out</span>
                <span className="rounded-full border border-[#d6c4a8] bg-[#efe3cf] px-3 py-1 text-[#3a2a18]">Ocupado</span>
                <span className="rounded-full border border-red-300 bg-red-50 px-3 py-1 text-red-800">Bloqueo</span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#75695b]">
                Sync OTA activo · sin dobles reservas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="flex h-full flex-col rounded-[2rem] border-[#dfd2bf] bg-white/74 shadow-sm md:col-span-6 xl:col-span-4"
          data-testid="dashboard-priority-card"
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Activity className="size-5" />
              Cola prioritaria
            </CardTitle>
            <p className="text-sm text-[#75695b]">Siguiente mejor acción para operaciones.</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-2.5">
            {operationQueue.slice(0, 2).map((item) => (
              <div key={item.label} className="rounded-3xl border border-[#dfd2bf] bg-[#fbf7ef] p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="mt-1 text-sm leading-5 text-[#75695b]">{item.description}</p>
                  </div>
                  <StatusBadge value={item.priority} />
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs text-[#75695b]">
                  <span>{item.type}</span>
                  <span>{item.due}</span>
                </div>
              </div>
            ))}
            <Button variant="outline" className="mt-auto rounded-full border-[#dfd2bf] bg-white" asChild>
              <Link href="/tasks">Ver cola completa</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="h-full rounded-[2rem] border-[#dfd2bf] bg-white/74 shadow-sm md:col-span-3 xl:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="size-5" />
              Inbox con SLA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inboxThreads.map((thread) => (
              <div key={thread.guest} className="rounded-3xl border border-[#dfd2bf] bg-[#fbf7ef] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{thread.guest}</p>
                    <p className="text-sm text-[#75695b]">{thread.property} · {thread.channel}</p>
                  </div>
                  <StatusBadge value={thread.status} />
                </div>
                <p className="mt-3 text-sm leading-6">{thread.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full rounded-[2rem] border-[#dfd2bf] bg-white/74 shadow-sm md:col-span-3 xl:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDollarSign className="size-5" />
              Salud de canales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {channelHealth.map((channel) => (
              <div key={channel.channel}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-semibold">{channel.channel}</p>
                    <p className="text-[#75695b]">{channel.bookings} reservas · {channel.revenue}</p>
                  </div>
                  <span className="font-mono text-xs text-[#75695b]">{channel.health}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eadfce]">
                  <div className="h-full rounded-full bg-[#160f09]" style={{ width: `${channel.health}%` }} />
                </div>
                <p className="mt-1 text-xs text-[#75695b]">{channel.sync}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full rounded-[2rem] border-[#dfd2bf] bg-white/74 shadow-sm md:col-span-6 xl:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5" />
              Automatizaciones activas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {automationRules.map((rule) => (
              <div key={rule.name} className="rounded-3xl border border-[#dfd2bf] bg-[#fbf7ef] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{rule.name}</p>
                  <CheckCircle2 className="size-4 text-emerald-700" />
                </div>
                <p className="mt-1 text-sm text-[#75695b]">{rule.trigger}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#75695b]">{rule.impact}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full rounded-[2rem] border-[#dfd2bf] bg-white/74 shadow-sm md:col-span-6 xl:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="size-5" />
              Tareas críticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => (
              <div key={task.title} className="flex items-center justify-between gap-3 rounded-3xl border border-[#dfd2bf] bg-[#fbf7ef] p-4">
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-[#75695b]">{task.property} · {task.due}</p>
                </div>
                <ArrowRight className="size-4 text-[#75695b]" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full rounded-[2rem] border-[#dfd2bf] bg-white/74 shadow-sm md:col-span-6 xl:col-span-8">
          <CardHeader>
            <CardTitle>Reservas que mueven la operación</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="rounded-3xl border border-[#dfd2bf] bg-[#fbf7ef] p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{reservation.guest}</p>
                  <StatusBadge value={reservation.status} />
                </div>
                <p className="mt-2 text-sm text-[#75695b]">{reservation.property}</p>
                <p className="mt-4 text-sm">{reservation.dates}</p>
                <p className="mt-2 text-2xl font-semibold">{reservation.amount}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
