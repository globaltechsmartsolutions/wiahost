import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import { getNotifications } from "@/lib/data/notifications";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

type NotificationsPageProps = {
  searchParams?: Promise<{
    error?: string;
    updated?: string;
  }>;
};

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const [notifications, params] = await Promise.all([
    getNotifications(),
    searchParams,
  ]);
  const unreadCount = notifications.filter(
    (notification) => notification.isUnread,
  ).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Centro de avisos"
        title="Notificaciones operativas bajo control."
        description="Revisa mensajes, pagos, incidencias y automatizaciones importantes sin perder trazabilidad."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}
      {params?.updated ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Notificaciones actualizadas correctamente.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total" value={String(notifications.length)} />
        <MetricCard label="Sin leer" value={String(unreadCount)} />
        <MetricCard
          label="Leidas"
          value={String(notifications.length - unreadCount)}
        />
      </section>

      <div className="flex justify-end">
        <form action={markAllNotificationsReadAction}>
          <Button
            type="submit"
            variant="outline"
            className="rounded-full border-[#dfd2bf] bg-white/70"
            disabled={unreadCount === 0}
          >
            Marcar todas como leidas
          </Button>
        </form>
      </div>

      <section className="grid gap-3">
        {notifications.length ? (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className="rounded-[1.6rem] border-border/80 bg-card/80"
            >
              <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight">
                      {notification.title}
                    </h2>
                    <StatusBadge value={notification.status} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {notification.body}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {notification.createdAt}
                  </p>
                </div>

                {notification.isUnread ? (
                  <form action={markNotificationReadAction}>
                    <input
                      type="hidden"
                      name="notificationId"
                      value={notification.id}
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      className="rounded-full border-[#dfd2bf] bg-white/70"
                    >
                      Marcar leida
                    </Button>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No hay notificaciones"
            description="Cuando haya avisos importantes de mensajes, pagos o incidencias apareceran aqui."
          />
        )}
      </section>
    </AppShell>
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
