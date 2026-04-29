import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  sendConversationReplyAction,
  updateConversationStatusAction,
} from "@/lib/actions/operations";
import { getConversationDetail } from "@/lib/data/operations";

export const dynamic = "force-dynamic";

type ConversationDetailPageProps = {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ sent?: string; updated?: string }>;
};

export default async function ConversationDetailPage({
  params,
  searchParams,
}: ConversationDetailPageProps) {
  const [{ conversationId }, { sent, updated }] = await Promise.all([
    params,
    searchParams,
  ]);
  const conversation = await getConversationDetail(conversationId);

  if (!conversation) {
    notFound();
  }

  return (
    <AppShell>
      <div className="mb-6">
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/inbox">Volver a inbox</Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Detalle de conversacion"
        title={conversation.guest}
        description={`${conversation.property} - ${conversation.channel} - espera ${conversation.waiting}`}
      />
      {sent ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Respuesta enviada y conversacion actualizada.
        </div>
      ) : null}
      {updated ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Estado de conversacion actualizado.
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.7fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Hilo de mensajes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                className="rounded-3xl border border-border/80 bg-background/70 p-4"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge value={message.direction} />
                    <StatusBadge value={message.channel} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {message.sentAt}
                  </span>
                </div>
                <p className="text-sm leading-6">{message.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Responder</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-semibold">Prioridad sugerida</span>
                <StatusBadge value={conversation.status} />
              </div>
              <p>{conversation.priorityReason}</p>
            </div>
            <form
              action={updateConversationStatusAction}
              className="grid gap-3"
            >
              <input
                type="hidden"
                name="conversationId"
                value={conversation.id}
              />
              <label className="grid gap-2 text-sm font-medium">
                Estado
                <select
                  name="status"
                  defaultValue="resolved"
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="open">Abierta</option>
                  <option value="pending_team">Pendiente equipo</option>
                  <option value="pending_guest">Pendiente huesped</option>
                  <option value="resolved">Resuelta</option>
                  <option value="archived">Archivada</option>
                </select>
              </label>
              <Button type="submit" variant="outline" className="rounded-full">
                Actualizar estado
              </Button>
            </form>
            <form action={sendConversationReplyAction} className="grid gap-3">
              <input
                type="hidden"
                name="conversationId"
                value={conversation.id}
              />
              <input type="hidden" name="channel" value="inbox" />
              <Textarea
                name="body"
                required
                placeholder="Escribe una respuesta clara y accionable..."
                className="min-h-36 bg-background"
              />
              <Button type="submit" className="rounded-full">
                Enviar respuesta
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
