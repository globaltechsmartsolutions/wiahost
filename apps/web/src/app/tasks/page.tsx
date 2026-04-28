import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { tasks } from "@/lib/demo-data";

export default function TasksPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Housekeeping y mantenimiento"
        title="Tareas conectadas a reservas, check-outs e incidencias."
        description="La operación diaria necesita responsables, prioridades, checklist y confirmación de cierre antes del siguiente check-in."
      />
      <section className="grid auto-rows-fr gap-4 md:grid-cols-3">
        {tasks.map((task) => (
          <Card key={task.title} className="h-full rounded-[2rem] border-border/80 bg-card/80">
            <CardContent className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-semibold">{task.title}</p>
                <StatusBadge value={task.priority} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{task.property}</p>
              <div className="mt-auto pt-8">
                <p className="text-sm">{task.type} · {task.due}</p>
                <div className="mt-3">
                  <StatusBadge value={task.status} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </AppShell>
  );
}
