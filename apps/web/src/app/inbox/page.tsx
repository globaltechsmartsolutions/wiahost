import { EmptyState } from "@/components/empty-state";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { getInboxThreads } from "@/lib/data/operations";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const inboxThreads = await getInboxThreads();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Inbox unificado"
        title="Conversaciones de canales y web directa en una bandeja."
        description="Preparado para WhatsApp Business, email, Airbnb, Booking, Vrbo y formularios propios con SLA de respuesta."
      />

      {inboxThreads.length ? (
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardContent className="space-y-3 p-5">
            {inboxThreads.map((thread) => (
              <div
                key={`${thread.guest}-${thread.waiting}`}
                className="grid gap-4 rounded-3xl border border-border/80 bg-background/60 p-4 md:grid-cols-[0.8fr_1.3fr_0.4fr] md:items-center"
              >
                <div>
                  <p className="font-semibold">{thread.guest}</p>
                  <p className="text-sm text-muted-foreground">
                    {thread.property} · {thread.channel}
                  </p>
                </div>
                <p className="text-sm leading-6">{thread.message}</p>
                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <span className="text-sm text-muted-foreground">{thread.waiting}</span>
                  <StatusBadge value={thread.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState title="Inbox sin conversaciones" description="Los mensajes de canales, email, WhatsApp o web directa apareceran aqui." />
      )}
    </AppShell>
  );
}
