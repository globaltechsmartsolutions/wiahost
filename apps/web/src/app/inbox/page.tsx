import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendConversationReplyAction } from "@/lib/actions/operations";
import { getInboxThreads } from "@/lib/data/operations";

export const dynamic = "force-dynamic";

type InboxPageProps = {
  searchParams?: Promise<{
    channel?: string;
    error?: string;
    q?: string;
    status?: string;
  }>;
};

function matches(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values)).sort((first, second) =>
    first.localeCompare(second, "es"),
  );
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const [inboxThreads, params] = await Promise.all([
    getInboxThreads(),
    searchParams,
  ]);
  const filters = {
    channel: params?.channel?.trim() ?? "",
    q: params?.q?.trim() ?? "",
    status: params?.status?.trim() ?? "",
  };
  const channels = uniqueValues(inboxThreads.map((thread) => thread.channel));
  const statuses = uniqueValues(inboxThreads.map((thread) => thread.status));
  const filteredThreads = inboxThreads.filter((thread) => {
    const text = `${thread.guest} ${thread.property} ${thread.message} ${thread.waiting}`;
    return (
      (!filters.q || matches(text, filters.q)) &&
      (!filters.status || thread.status === filters.status) &&
      (!filters.channel || thread.channel === filters.channel)
    );
  });

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

      <Card className="mb-5 rounded-[1.6rem] border-border/80 bg-card/80">
        <CardContent className="p-4">
          <form className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto] lg:items-end">
            <div className="grid gap-2">
              <Label htmlFor="inboxSearch">Buscar</Label>
              <Input
                id="inboxSearch"
                name="q"
                defaultValue={filters.q}
                placeholder="Huesped, propiedad o mensaje"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inboxStatus">Estado</Label>
              <select
                id="inboxStatus"
                name="status"
                defaultValue={filters.status}
                className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Todos</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inboxChannel">Canal</Label>
              <select
                id="inboxChannel"
                name="channel"
                defaultValue={filters.channel}
                className="h-9 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Todos</option>
                {channels.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="rounded-full">
                Filtrar
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/inbox">Limpiar</Link>
              </Button>
            </div>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Mostrando {filteredThreads.length} de {inboxThreads.length} conversaciones.
          </p>
        </CardContent>
      </Card>

      {filteredThreads.length ? (
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardContent className="space-y-3 p-5">
            {filteredThreads.map((thread) => (
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
          title={inboxThreads.length ? "Sin conversaciones para esos filtros" : "Inbox sin conversaciones"}
          description={
            inboxThreads.length
              ? "Prueba a limpiar filtros o buscar por otro canal, huesped o estado."
              : "Los mensajes de canales, email, WhatsApp o web directa apareceran aqui."
          }
        />
      )}
    </AppShell>
  );
}
