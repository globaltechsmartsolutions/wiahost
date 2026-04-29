import Link from "next/link";
import { notFound } from "next/navigation";

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
import { Textarea } from "@/components/ui/textarea";
import {
  createConversationLabelAction,
  sendConversationReplyAction,
  updateConversationStatusAction,
} from "@/lib/actions/operations";
import { getConversationDetail } from "@/lib/data/operations";

export const dynamic = "force-dynamic";

type ConversationDetailPageProps = {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{
    error?: string;
    labeled?: string;
    sent?: string;
    updated?: string;
  }>;
};

export default async function ConversationDetailPage({
  params,
  searchParams,
}: ConversationDetailPageProps) {
  const [{ conversationId }, { error, labeled, sent, updated }] =
    await Promise.all([
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
      {error ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
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
      {labeled ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Etiqueta guardada para auditoria y entrenamiento futuro.
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

        <div className="grid content-start gap-5">
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
                <Button
                  type="submit"
                  variant="outline"
                  className="rounded-full"
                >
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

          <Card className="rounded-[2rem] border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>Feedback humano</CardTitle>
              <CardDescription>
                Etiquetas revisadas por operaciones para auditoria, reglas e IA
                futura.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3">
                {conversation.labels.length ? (
                  conversation.labels.map((label) => (
                    <div
                      className="rounded-2xl border border-[#dfd2bf] bg-white/60 p-3 text-sm"
                      key={label.id}
                    >
                      <div className="mb-2 flex flex-wrap gap-2">
                        <StatusBadge value={label.urgency} />
                        <StatusBadge value={label.sentiment} />
                        <StatusBadge value={label.source} />
                      </div>
                      <p className="font-semibold">{label.category}</p>
                      <p className="mt-1 text-muted-foreground">
                        {label.intent} · {label.language} · {label.createdAt}
                      </p>
                      <p className="mt-2 text-muted-foreground">
                        {label.rationale}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#dfd2bf] bg-white/50 p-4 text-sm text-muted-foreground">
                    Sin etiquetas humanas todavia. La primera etiqueta ayuda a
                    calibrar prioridad, sentimiento e intencion.
                  </div>
                )}
              </div>

              <form action={createConversationLabelAction} className="grid gap-3">
                <input
                  type="hidden"
                  name="conversationId"
                  value={conversation.id}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Urgencia
                    <select
                      name="urgency"
                      className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Sin urgencia</option>
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="critical">Critica</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Sentimiento
                    <select
                      name="sentiment"
                      className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Sin sentimiento</option>
                      <option value="positive">Positivo</option>
                      <option value="neutral">Neutral</option>
                      <option value="negative">Negativo</option>
                      <option value="mixed">Mixto</option>
                      <option value="unknown">Desconocido</option>
                    </select>
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-medium">
                  Categoria
                  <input
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                    name="category"
                    placeholder="check-in, queja, acceso, mantenimiento..."
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-[1fr_0.45fr]">
                  <label className="grid gap-2 text-sm font-medium">
                    Intencion
                    <input
                      className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                      name="intent"
                      placeholder="solicita instrucciones"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Idioma
                    <input
                      className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                      name="language"
                      placeholder="es"
                    />
                  </label>
                </div>
                <Textarea
                  name="rationale"
                  placeholder="Motivo de la etiqueta o contexto operativo..."
                  className="min-h-24 bg-background"
                />
                <Button type="submit" className="rounded-full">
                  Guardar etiqueta humana
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
