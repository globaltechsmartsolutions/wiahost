import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { sendConversationReplyAction } from "@/lib/actions/operations";
import { getInboxThreads } from "@/lib/data/operations";

export const dynamic = "force-dynamic";

type InboxPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const [inboxThreads, params] = await Promise.all([
    getInboxThreads(),
    searchParams,
  ]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Inbox unificado"
        title="Conversaciones de canales y web directa en una bandeja."
        description="Responde desde el panel y deja preparada la base para WhatsApp Business, email, Airbnb, Booking, Vrbo y formularios propios."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}

      {inboxThreads.length ? (
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardContent className="space-y-3 p-5">
            {inboxThreads.map((thread) => (
              <div
                key={thread.id}
                className="grid gap-4 rounded-3xl border border-border/80 bg-background/60 p-4 xl:grid-cols-[0.8fr_1.2fr_0.45fr] xl:items-start"
              >
                <div>
                  <p className="font-semibold">{thread.guest}</p>
                  <p className="text-sm text-muted-foreground">
                    {thread.property} - {thread.channel}
                  </p>
                </div>
                <div>
                  <p className="text-sm leading-6">{thread.message}</p>
                  <form
                    action={sendConversationReplyAction}
                    className="mt-4 grid gap-2"
                  >
                    <input
                      type="hidden"
                      name="conversationId"
                      value={thread.id}
                    />
                    <input type="hidden" name="channel" value="inbox" />
                    <Textarea
                      name="body"
                      required
                      placeholder="Responder al huesped..."
                      className="min-h-20 bg-card"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="justify-self-end rounded-full"
                    >
                      Enviar respuesta
                    </Button>
                  </form>
                </div>
                <div className="flex items-center justify-between gap-3 xl:justify-end">
                  <span className="text-sm text-muted-foreground">
                    {thread.waiting}
                  </span>
                  <StatusBadge value={thread.status} />
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                  >
                    <Link href={`/inbox/${thread.id}`}>Abrir</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="Inbox sin conversaciones"
          description="Los mensajes de canales, email, WhatsApp o web directa apareceran aqui."
        />
      )}
    </AppShell>
  );
}
