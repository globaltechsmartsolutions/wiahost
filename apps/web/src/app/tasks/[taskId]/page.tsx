import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTaskDetail } from "@/lib/data/operations";

export const dynamic = "force-dynamic";

type TaskDetailPageProps = {
  params: Promise<{ taskId: string }>;
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { taskId } = await params;
  const task = await getTaskDetail(taskId);

  if (!task) {
    notFound();
  }

  return (
    <AppShell>
      <div className="mb-6">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/tasks">Volver a tareas</Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Detalle de tarea"
        title={task.title}
        description={`${task.property} - ${task.type}`}
      />

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.7fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Operacion</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge value={task.status} />
              <StatusBadge value={task.priority} />
            </div>
            <p className="rounded-3xl bg-background/70 p-5 text-sm leading-6 text-muted-foreground">
              {task.description}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Datos clave</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {task.fields.map((field) => (
              <div
                key={field.label}
                className="flex items-center justify-between gap-4 rounded-2xl bg-background/70 px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">
                  {field.label}
                </span>
                <span className="text-right text-sm font-semibold">
                  {field.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
