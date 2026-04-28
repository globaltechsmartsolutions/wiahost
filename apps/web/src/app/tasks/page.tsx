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
  searchParams?: Promise<{
    error?: string;
    priority?: string;
    q?: string;
    status?: string;
    type?: string;
    updated?: string;
  }>;
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

function matches(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const [options, tasks, params] = await Promise.all([
    getOperationFormOptions(),
    getTasks(),
    searchParams,
  ]);
  const filters = {
    priority: params?.priority?.trim() ?? "",
    q: params?.q?.trim() ?? "",
    status: params?.status?.trim() ?? "",
    type: params?.type?.trim() ?? "",
  };
  const filteredTasks = tasks.filter((task) => {
    const text = `${task.title} ${task.property} ${task.due}`;
    return (
      (!filters.q || matches(text, filters.q)) &&
      (!filters.status || task.status === filters.status) &&
      (!filters.priority || task.priority === filters.priority) &&
      (!filters.type || task.type === filters.type)
    );
  });

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
      {params?.updated ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Estado de tarea actualizado.
        </div>
      ) : null}

      <Card className="mb-5 rounded-[1.6rem] border-border/80 bg-card/80">
        <CardContent className="p-4">
          <form className="grid gap-3 xl:grid-cols-[1.3fr_0.75fr_0.75fr_0.8fr_auto] xl:items-end">
            <div className="grid gap-2">
              <Label htmlFor="taskSearch">Buscar</Label>
              <Input
                id="taskSearch"
                name="q"
                defaultValue={filters.q}
                placeholder="Titulo, propiedad o vencimiento"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taskStatus">Estado</Label>
              <select
                id="taskStatus"
                name="status"
                defaultValue={filters.status}
                className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Todos</option>
                {taskStatuses.map((status) => (
                  <option key={status.label} value={status.label}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taskPriority">Prioridad</Label>
              <select
                id="taskPriority"
                name="priority"
                defaultValue={filters.priority}
                className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Todas</option>
                {priorities.map((priority) => (
                  <option key={priority.label} value={priority.label}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taskType">Tipo</Label>
              <select
                id="taskType"
                name="type"
                defaultValue={filters.type}
                className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Todos</option>
                {taskTypes.map((type) => (
                  <option key={type.label} value={type.label}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="rounded-full">
                Filtrar
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/tasks">Limpiar</Link>
              </Button>
            </div>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Mostrando {filteredTasks.length} de {tasks.length} tareas.
          </p>
        </CardContent>
      </Card>

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

        {filteredTasks.length ? (
          <section className="grid auto-rows-fr gap-4 md:grid-cols-2">
            {filteredTasks.map((task) => (
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
                          aria-label={`Cambiar estado de tarea ${task.title}`}
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
            title={tasks.length ? "Sin tareas para esos filtros" : "No hay tareas abiertas"}
            description={
              tasks.length
                ? "Prueba a limpiar filtros o buscar por otro tipo, prioridad o estado."
                : "Las tareas de limpieza, mantenimiento e inspeccion apareceran aqui."
            }
          />
        )}
      </section>
    </AppShell>
  );
}
