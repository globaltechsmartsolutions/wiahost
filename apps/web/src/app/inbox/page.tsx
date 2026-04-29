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
import { ingestChannelMessageAction } from "@/lib/actions/channel-messages";
import {
  sendConversationReplyAction,
  updateConversationStatusAction,
} from "@/lib/actions/operations";
import {
  getInboxThreads,
  getOperationFormOptions,
} from "@/lib/data/operations";

export const dynamic = "force-dynamic";

type InboxPageProps = {
  searchParams?: Promise<{
    channel?: string;
    error?: string;
    q?: string;
    received?: string;
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
  const [inboxThreads, options, params] = await Promise.all([
    getInboxThreads(),
    getOperationFormOptions(),
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
      {params?.received ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Mensaje entrante normalizado correctamente.
        </div>
      ) : null}

      <Card className="rounded-[1.8rem] border-border/80 bg-card/80">
        <CardContent className="p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold">Entrada manual de canal</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Simula o registra mensajes que llegan desde Airbnb, Booking, Vrbo,
              email o WhatsApp. El sistema crea contacto, conversacion, mensaje
              inbound y evento de sincronizacion.
            </p>
          </div>
          <form
            action={ingestChannelMessageAction}
            className="grid gap-4 xl:grid-cols-4"
          >
            <Field label="Propiedad" id="inboundPropertyId">
              <SelectField
                id="inboundPropertyId"
                name="propertyId"
                options={options.properties}
                placeholder="Selecciona propiedad"
              />
            </Field>
            <Field label="Reserva opcional" id="inboundReservationId">
              <SelectField
                id="inboundReservationId"
                name="reservationId"
                options={options.reservations}
                placeholder="Sin reserva vinculada"
              />
            </Field>
            <Field label="Canal" id="inboundChannel">
              <OptionSelect
                id="inboundChannel"
                name="channel"
                options={[
                  { label: "Airbnb", value: "airbnb" },
                  { label: "Booking", value: "booking" },
                  { label: "Vrbo", value: "vrbo" },
                  { label: "Email", value: "email" },
                  { label: "WhatsApp", value: "whatsapp" },
                  { label: "SMS", value: "sms" },
                ]}
                value="airbnb"
              />
            </Field>
            <Field label="ID externo" id="externalMessageId">
              <Input
                id="externalMessageId"
                name="externalMessageId"
                placeholder="airbnb-msg-123"
              />
            </Field>
            <Field label="Nombre huesped" id="guestFullName">
              <Input
                id="guestFullName"
                name="guestFullName"
                placeholder="Sofia Martin"
                required
              />
            </Field>
            <Field label="Email" id="guestEmail">
              <Input
                id="guestEmail"
                name="guestEmail"
                placeholder="sofia@example.com"
                type="email"
              />
            </Field>
            <Field label="Telefono" id="guestPhone">
              <Input
                id="guestPhone"
                name="guestPhone"
                placeholder="+34 600 000 000"
              />
            </Field>
            <div className="xl:col-span-4">
              <Field label="Mensaje" id="inboundBody">
                <Textarea
                  id="inboundBody"
                  name="body"
                  placeholder="Hola, llegamos tarde al check-in. ¿Podemos entrar a las 23:30?"
                  required
                  rows={3}
                />
              </Field>
            </div>
            <div className="xl:col-span-4">
              <Button type="submit" className="rounded-full">
                Normalizar mensaje
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
            Mostrando {filteredThreads.length} de {inboxThreads.length}{" "}
            conversaciones.
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
                  <p className="mt-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                    Prioridad: {thread.priorityReason}
                  </p>
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
                  <form action={updateConversationStatusAction}>
                    <input
                      type="hidden"
                      name="conversationId"
                      value={thread.id}
                    />
                    <input type="hidden" name="status" value="resolved" />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                    >
                      Resolver
                    </Button>
                  </form>
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
          title={
            inboxThreads.length
              ? "Sin conversaciones para esos filtros"
              : "Inbox sin conversaciones"
          }
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

function SelectField({
  id,
  name,
  options,
  placeholder,
}: {
  id: string;
  name: string;
  options: Array<{ helper?: string; id: string; label: string }>;
  placeholder: string;
}) {
  return (
    <select
      id={id}
      name={name}
      className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
      defaultValue=""
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.helper ? `${option.label} - ${option.helper}` : option.label}
        </option>
      ))}
    </select>
  );
}

function OptionSelect({
  id,
  name,
  options,
  value,
}: {
  id: string;
  name: string;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={value}
      className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Field({
  children,
  id,
  label,
}: {
  children: React.ReactNode;
  id: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
