import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
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
import {
  createTaskAction,
  updateTaskStatusAction,
} from "@/lib/actions/operations";
import { getOperationFormOptions, getTasks } from "@/lib/data/operations";

export const dynamic = "force-dynamic";

type TasksPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

const taskTypes = [
  { label: "Limpieza", value: "cleaning" },
  { label: "Mantenimiento", value: "maintenance" },
  { label: "Inspeccion", value: "inspection" },
  { label: "Peticion huesped", value: "guest_request" },
  { label: "Administracion", value: "admin" },
];

const taskStatuses = [
  { label: "Abierta", value: "open" },
  { label: "Programada", value: "scheduled" },
  { label: "En curso", value: "in_progress" },
  { label: "Bloqueada", value: "blocked" },
  { label: "Cerrada", value: "done" },
  { label: "Cancelada", value: "cancelled" },
];

const priorities = [
  { label: "Baja", value: "low" },
  { label: "Media", value: "medium" },
  { label: "Alta", value: "high" },
  { label: "Critica", value: "critical" },
];

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const [options, tasks, params] = await Promise.all([
    getOperationFormOptions(),
    getTasks(),
    searchParams,
  ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Housekeeping y mantenimiento"
        title="Tareas conectadas a reservas, check-outs e incidencias."
        description="Crea tareas, asigna prioridad y cierra acciones antes de que afecten a la experiencia del huesped."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.4fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Nueva tarea operativa</CardTitle>
            <CardDescription>
              Limpieza, mantenimiento, inspecciones o acciones internas del
              equipo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createTaskAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="propertyId">Propiedad</Label>
                <select
                  id="propertyId"
                  name="propertyId"
                  required
                  className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {options.properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reservationId">Reserva relacionada</Label>
                <select
                  id="reservationId"
                  name="reservationId"
                  className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Sin reserva concreta</option>
                  {options.reservations.map((reservation) => (
                    <option key={reservation.id} value={reservation.id}>
                      {reservation.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Titulo</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="Ej. Preparar check-in autonomo"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo</Label>
                  <select
                    id="type"
                    name="type"
                    className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    {taskTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <select
                    id="priority"
                    name="priority"
                    className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    {priorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueAt">Vencimiento</Label>
                  <Input id="dueAt" name="dueAt" type="datetime-local" />
                </div>
              </div>

              <Textarea
                name="description"
                placeholder="Checklist, instrucciones o contexto para quien la ejecute."
              />
              <Button type="submit" className="rounded-full">
                Crear tarea
              </Button>
            </form>
          </CardContent>
        </Card>

        {tasks.length ? (
          <section className="grid auto-rows-fr gap-4 md:grid-cols-2">
            {tasks.map((task) => (
              <Card
                key={task.id}
                className="h-full rounded-[2rem] border-border/80 bg-card/80"
              >
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-lg font-semibold">{task.title}</p>
                    <StatusBadge value={task.priority} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {task.property}
                  </p>
                  <div className="mt-auto pt-8">
                    <p className="text-sm">
                      {task.type} - {task.due}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <StatusBadge value={task.status} />
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="ml-auto rounded-full"
                      >
                        <Link href={`/tasks/${task.id}`}>Detalle</Link>
                      </Button>
                      <form
                        action={updateTaskStatusAction}
                        className="flex gap-2"
                      >
                        <input type="hidden" name="taskId" value={task.id} />
                        <select
                          name="status"
                          className="h-8 rounded-xl border border-input bg-background px-2 text-xs"
                        >
                          {taskStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                        >
                          Guardar
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        ) : (
          <EmptyState
            title="No hay tareas abiertas"
            description="Las tareas de limpieza, mantenimiento e inspeccion apareceran aqui."
          />
        )}
      </section>
    </AppShell>
  );
}
