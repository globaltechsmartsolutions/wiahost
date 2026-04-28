import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateTaskAction } from "@/lib/actions/operations";
import { getOperationFormOptions, getTaskDetail } from "@/lib/data/operations";

type EditTaskPageProps = {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{ error?: string }>;
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

export default async function EditTaskPage({
  params,
  searchParams,
}: EditTaskPageProps) {
  const [{ taskId }, { error }, options] = await Promise.all([
    params,
    searchParams,
    getOperationFormOptions(),
  ]);
  const task = await getTaskDetail(taskId);

  if (!task) {
    notFound();
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          eyebrow="Tareas"
          title={`Editar ${task.title}`}
          description="Ajusta prioridad, vencimiento, reserva relacionada y estado de ejecucion."
        />
        <Button
          asChild
          variant="outline"
          className="rounded-full border-[#dfd2bf] bg-white/70"
        >
          <Link href={`/tasks/${task.id}`}>Volver al detalle</Link>
        </Button>
      </div>

      <Card className="rounded-[2rem] border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Datos de la tarea</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}
          <form action={updateTaskAction} className="grid gap-5">
            <input type="hidden" name="taskId" value={task.id} />

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Propiedad" id="propertyId">
                <select
                  id="propertyId"
                  name="propertyId"
                  required
                  defaultValue={task.raw.propertyId}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {options.properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Reserva relacionada" id="reservationId">
                <select
                  id="reservationId"
                  name="reservationId"
                  defaultValue={task.raw.reservationId ?? ""}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Sin reserva concreta</option>
                  {options.reservations.map((reservation) => (
                    <option key={reservation.id} value={reservation.id}>
                      {reservation.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Titulo" id="title">
              <Input
                id="title"
                name="title"
                required
                defaultValue={task.raw.title}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Tipo" id="type">
                <select
                  id="type"
                  name="type"
                  defaultValue={task.raw.type}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {taskTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Estado" id="status">
                <select
                  id="status"
                  name="status"
                  defaultValue={task.raw.status}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {taskStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Prioridad" id="priority">
                <select
                  id="priority"
                  name="priority"
                  defaultValue={task.raw.priority}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Vencimiento" id="dueAt">
                <Input
                  id="dueAt"
                  name="dueAt"
                  type="datetime-local"
                  defaultValue={task.raw.dueAt ?? ""}
                />
              </Field>
            </div>

            <Field label="Descripcion" id="description">
              <Textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={task.raw.description ?? ""}
              />
            </Field>

            <div className="flex justify-end">
              <Button type="submit" className="rounded-full">
                Guardar tarea
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Field({
  children,
  id,
  label,
}: {
  children: ReactNode;
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
