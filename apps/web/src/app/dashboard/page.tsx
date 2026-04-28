import { ArrowRight, CalendarDays, Inbox, Wrench } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calendarDays, dashboardMetrics, inboxThreads, reservations, tasks } from "@/lib/demo-data";

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Centro de mando"
        title="Operación diaria, revenue y servicio al huésped en una sola vista."
        description="El dashboard prioriza lo que puede bloquear una estancia: llegadas, mensajes sin respuesta, limpiezas, incidencias y salud comercial por canal."
      />

      <section className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboardMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5" />
                Calendario operativo
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Reservas, bloqueos y tareas por día.</p>
            </div>
            <Button variant="outline" className="rounded-full" asChild>
              <a href="/calendar">Abrir calendario</a>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 lg:grid-cols-7">
              {calendarDays.map((day) => (
                <div key={`${day.day}-${day.date}`} className="min-h-44 rounded-3xl border border-border/80 bg-background/60 p-4">
                  <p className="text-sm text-muted-foreground">{day.day}</p>
                  <p className="mt-1 text-3xl font-semibold">{day.date}</p>
                  <div className="mt-4 space-y-2">
                    {day.events.map((event) => (
                      <div key={event} className="rounded-2xl bg-card px-3 py-2 text-xs font-medium shadow-sm">
                        {event}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-[2rem] border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="size-5" />
                Inbox prioritario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {inboxThreads.slice(0, 3).map((thread) => (
                <div key={thread.guest} className="rounded-3xl border border-border/80 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{thread.guest}</p>
                      <p className="text-sm text-muted-foreground">{thread.property} · {thread.channel}</p>
                    </div>
                    <StatusBadge value={thread.status} />
                  </div>
                  <p className="mt-3 text-sm leading-6">{thread.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="size-5" />
                Próximas acciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.map((task) => (
                <div key={task.title} className="flex items-center justify-between gap-3 rounded-3xl border border-border/80 bg-background/60 p-4">
                  <div>
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.property} · {task.due}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-6">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Reservas que mueven la operación</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="rounded-3xl border border-border/80 bg-background/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{reservation.guest}</p>
                  <StatusBadge value={reservation.status} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{reservation.property}</p>
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
