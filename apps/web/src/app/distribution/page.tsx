import {
  createListingAction,
  createSyncEventAction,
  deleteListingAction,
  updateListingAction,
} from "@/lib/actions/distribution";
import {
  channelOptions,
  getDistributionData,
  listingStatusOptions,
  syncDirectionOptions,
  syncStatusOptions,
  type DistributionFormOptions,
  type ListingListItem,
} from "@/lib/data/distribution";
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
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

type DistributionPageProps = {
  searchParams?: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
    synced?: string;
    updated?: string;
  }>;
};

export default async function DistributionPage({
  searchParams,
}: DistributionPageProps) {
  const [{ listings, options, syncEvents }, params] = await Promise.all([
    getDistributionData(),
    searchParams,
  ]);

  const publishedListings = listings.filter(
    (listing) => listing.raw.status === "published",
  ).length;
  const syncedListings = listings.filter(
    (listing) => listing.syncEnabled,
  ).length;
  const listingsWithErrors = listings.filter(
    (listing) => listing.raw.status === "sync_error",
  ).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Distribucion y anuncios"
        title="Publicaciones, canales y sincronizacion bajo control."
        description="Gestiona anuncios por canal, web directa y eventos de sincronizacion. Esta capa prepara la conexion futura con portales, iCal, mensajes entrantes y motor de reserva directa."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}
      {params?.created ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Publicacion creada correctamente.
        </div>
      ) : null}
      {params?.updated ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Publicacion actualizada correctamente.
        </div>
      ) : null}
      {params?.deleted ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Publicacion eliminada correctamente.
        </div>
      ) : null}
      {params?.synced ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Evento de sincronizacion registrado correctamente.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Publicaciones" value={String(listings.length)} />
        <MetricCard label="Publicadas" value={String(publishedListings)} />
        <MetricCard label="Sync activo" value={String(syncedListings)} />
        <MetricCard label="Errores" value={String(listingsWithErrors)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]">
        <div className="grid gap-5">
          <Card className="rounded-[2rem] border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>Nueva publicacion</CardTitle>
              <CardDescription>
                Crea el anuncio base para un canal. El envio automatico a
                portales se conectara despues por API/iCal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createListingAction} className="grid gap-4">
                <ListingFields options={options} />
                <Button type="submit" className="rounded-full">
                  Crear publicacion
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle>Registrar sync</CardTitle>
              <CardDescription>
                Guarda cada intercambio con canales para poder auditar fallos,
                duplicidades y mensajes futuros.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createSyncEventAction} className="grid gap-4">
                <SyncEventFields options={options} />
                <Button type="submit" className="rounded-full">
                  Registrar evento
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-4">
          {listings.length ? (
            listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                options={options}
              />
            ))
          ) : (
            <EmptyState
              title="Todavia no hay publicaciones"
              description="Crea el primer anuncio por canal para preparar distribucion y reserva directa."
            />
          )}
        </section>
      </section>

      <Card className="rounded-[2rem] border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle>Eventos recientes de canales</CardTitle>
          <CardDescription>
            Historial de sincronizaciones entrantes y salientes para
            disponibilidad, precios, reservas y mensajes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {syncEvents.length ? (
            syncEvents.map((event) => (
              <div
                key={event.id}
                className="grid gap-3 rounded-2xl border border-[#dfd2bf] bg-white/55 p-4 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{event.context}</p>
                    <StatusBadge value={event.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.channel} - {event.direction} - {event.payloadSummary}
                  </p>
                  {event.errorMessage !== "Sin error" ? (
                    <p className="mt-2 text-sm text-red-700">
                      {event.errorMessage}
                    </p>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {event.createdAt}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin eventos de sync"
              description="Cuando publiquemos, importemos reservas o recibamos mensajes, quedaran aqui."
            />
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function ListingCard({
  listing,
  options,
}: {
  listing: ListingListItem;
  options: DistributionFormOptions;
}) {
  return (
    <Card className="rounded-[2rem] border-border/80 bg-card/80">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{listing.title}</CardTitle>
            <CardDescription>
              {listing.property} - {listing.channel} - Sync:{" "}
              {listing.syncEnabled ? "activo" : "manual"}
            </CardDescription>
          </div>
          <StatusBadge value={listing.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 rounded-2xl border border-[#dfd2bf] bg-white/55 p-4 md:grid-cols-4">
          <MiniFact label="ID externo" value={listing.externalListingId} />
          <MiniFact label="URL canal" value={listing.channelUrl} />
          <MiniFact label="Feed iCal" value={listing.icalUrl} />
          <MiniFact label="Ultimo sync" value={listing.lastSyncedAt} />
        </div>
        <p className="text-sm text-muted-foreground">{listing.syncNotes}</p>

        <form action={updateListingAction} className="grid gap-4">
          <input type="hidden" name="listingId" value={listing.id} />
          <ListingFields
            fieldPrefix={listing.id}
            listing={listing.raw}
            options={options}
          />
          <div className="flex justify-end">
            <Button type="submit" className="rounded-full">
              Guardar publicacion
            </Button>
          </div>
        </form>

        <form action={deleteListingAction}>
          <input type="hidden" name="listingId" value={listing.id} />
          <Button
            type="submit"
            variant="outline"
            className="rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            Eliminar publicacion
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ListingFields({
  fieldPrefix,
  listing,
  options,
}: {
  fieldPrefix?: string;
  listing?: ListingListItem["raw"];
  options: DistributionFormOptions;
}) {
  const prefix = fieldPrefix ? `${fieldPrefix}-` : "";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Propiedad" id={`${prefix}propertyId`}>
        <SelectField
          id={`${prefix}propertyId`}
          name="propertyId"
          options={options.properties}
          placeholder="Selecciona propiedad"
          value={listing?.propertyId}
        />
      </Field>
      <Field label="Canal" id={`${prefix}channel`}>
        <OptionSelect
          id={`${prefix}channel`}
          name="channel"
          options={channelOptions}
          value={listing?.channel ?? "direct"}
        />
      </Field>
      <Field label="Titulo" id={`${prefix}title`}>
        <Input
          id={`${prefix}title`}
          name="title"
          required
          defaultValue={listing?.title ?? ""}
          placeholder="Atico Gran Via Sky - Airbnb"
        />
      </Field>
      <Field label="Estado" id={`${prefix}status`}>
        <OptionSelect
          id={`${prefix}status`}
          name="status"
          options={listingStatusOptions}
          value={listing?.status ?? "draft"}
        />
      </Field>
      <Field label="ID externo" id={`${prefix}externalListingId`}>
        <Input
          id={`${prefix}externalListingId`}
          name="externalListingId"
          defaultValue={listing?.externalListingId ?? ""}
          placeholder="airbnb-12345"
        />
      </Field>
      <Field label="Slug web directa" id={`${prefix}publicSlug`}>
        <Input
          id={`${prefix}publicSlug`}
          name="publicSlug"
          defaultValue={listing?.publicSlug ?? ""}
          placeholder="atico-gran-via-sky"
        />
      </Field>
      <Field label="URL canal" id={`${prefix}channelUrl`}>
        <Input
          id={`${prefix}channelUrl`}
          name="channelUrl"
          defaultValue={listing?.channelUrl ?? ""}
          placeholder="https://..."
        />
      </Field>
      <label className="flex items-center gap-3 rounded-2xl bg-background/70 px-4 py-3 text-sm font-medium">
        <input
          type="checkbox"
          name="syncEnabled"
          defaultChecked={listing?.syncEnabled ?? false}
          className="size-4 accent-[#160f09]"
        />
        Sync activo
      </label>
      <div className="md:col-span-2">
        <Field label="Notas de sync" id={`${prefix}syncNotes`}>
          <Textarea
            id={`${prefix}syncNotes`}
            name="syncNotes"
            rows={3}
            defaultValue={listing?.syncNotes ?? ""}
            placeholder="Disponibilidad por iCal, mensajes por API, precios manuales..."
          />
        </Field>
      </div>
    </div>
  );
}

function SyncEventFields({ options }: { options: DistributionFormOptions }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Publicacion" id="listingId">
        <SelectField
          id="listingId"
          name="listingId"
          options={options.listings}
          placeholder="Sin publicacion directa"
        />
      </Field>
      <Field label="Propiedad" id="propertyId">
        <SelectField
          id="propertyId"
          name="propertyId"
          options={options.properties}
          placeholder="Sin propiedad directa"
        />
      </Field>
      <Field label="Canal" id="syncChannel">
        <OptionSelect
          id="syncChannel"
          name="channel"
          options={channelOptions}
          value="direct"
        />
      </Field>
      <Field label="Estado" id="syncStatus">
        <OptionSelect
          id="syncStatus"
          name="status"
          options={syncStatusOptions}
          value="pending"
        />
      </Field>
      <Field label="Direccion" id="direction">
        <OptionSelect
          id="direction"
          name="direction"
          options={syncDirectionOptions}
          value="outbound"
        />
      </Field>
      <Field label="Error" id="errorMessage">
        <Input
          id="errorMessage"
          name="errorMessage"
          placeholder="Solo si el sync falla"
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Payload JSON" id="payload">
          <Textarea
            id="payload"
            name="payload"
            rows={4}
            defaultValue='{"action":"publish_listing"}'
          />
        </Field>
      </div>
    </div>
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

function SelectField({
  id,
  name,
  options,
  placeholder,
  value,
}: {
  id: string;
  name: string;
  options: Array<{ helper?: string; id: string; label: string }>;
  placeholder: string;
  value?: string;
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={value ?? ""}
      className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
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
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
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

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
