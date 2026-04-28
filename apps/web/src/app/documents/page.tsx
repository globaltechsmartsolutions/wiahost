import {
  createDocumentAction,
  deleteDocumentAction,
  updateDocumentAction,
} from "@/lib/actions/documents";
import {
  getDocumentFormOptions,
  getDocuments,
  type DocumentFormOptions,
  type DocumentListItem,
} from "@/lib/data/documents";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
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
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

type DocumentsPageProps = {
  searchParams?: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
    updated?: string;
  }>;
};

export default async function DocumentsPage({
  searchParams,
}: DocumentsPageProps) {
  const [documents, options, params] = await Promise.all([
    getDocuments(),
    getDocumentFormOptions(),
    searchParams,
  ]);

  const linkedToReservations = documents.filter(
    (document) => document.raw.reservationId,
  ).length;
  const linkedToIncidents = documents.filter(
    (document) => document.raw.incidentId,
  ).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Documentos"
        title="Evidencias operativas y archivos vinculados."
        description="Centraliza contratos, check-in, fotos de incidencias y referencias de storage sin perder el contexto de propiedad, reserva o incidencia."
      />

      {params?.error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {params.error}
        </div>
      ) : null}
      {params?.created ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Documento creado correctamente.
        </div>
      ) : null}
      {params?.updated ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Documento actualizado correctamente.
        </div>
      ) : null}
      {params?.deleted ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Documento eliminado correctamente.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Documentos" value={String(documents.length)} />
        <MetricCard label="Reservas" value={String(linkedToReservations)} />
        <MetricCard label="Incidencias" value={String(linkedToIncidents)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1.35fr]">
        <Card className="rounded-[2rem] border-border/80 bg-card/80">
          <CardHeader>
            <CardTitle>Nuevo documento</CardTitle>
            <CardDescription>
              Registra la evidencia ahora y conserva la ruta exacta para cuando
              activemos upload avanzado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createDocumentAction} className="grid gap-4">
              <DocumentFields options={options} />
              <Button type="submit" className="rounded-full">
                Crear documento
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="grid gap-4">
          {documents.length ? (
            documents.map((document) => (
              <DocumentCard
                document={document}
                key={document.id}
                options={options}
              />
            ))
          ) : (
            <EmptyState
              title="Todavia no hay documentos"
              description="Crea la primera evidencia y vinculala a una propiedad, reserva o incidencia."
            />
          )}
        </section>
      </section>
    </AppShell>
  );
}

function DocumentCard({
  document,
  options,
}: {
  document: DocumentListItem;
  options: DocumentFormOptions;
}) {
  return (
    <Card className="rounded-[2rem] border-border/80 bg-card/80">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{document.title}</CardTitle>
            <CardDescription>
              {document.context} - {document.createdAt}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="border-[#dfd2bf] bg-white/70 text-[#5b4b3b]"
          >
            {document.mimeType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-2xl border border-[#dfd2bf] bg-white/55 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Ruta storage
          </p>
          <p className="mt-2 break-all font-mono text-sm">
            {document.storagePath}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Propiedad: {document.property}
          </p>
        </div>

        <form action={updateDocumentAction} className="grid gap-4">
          <input type="hidden" name="documentId" value={document.id} />
          <DocumentFields
            document={document.raw}
            fieldPrefix={document.id}
            options={options}
          />
          <div className="flex justify-end">
            <Button type="submit" className="rounded-full">
              Guardar documento
            </Button>
          </div>
        </form>

        <form action={deleteDocumentAction}>
          <input type="hidden" name="documentId" value={document.id} />
          <Button
            type="submit"
            variant="outline"
            className="rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            Eliminar documento
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DocumentFields({
  document,
  fieldPrefix,
  options,
}: {
  document?: DocumentListItem["raw"];
  fieldPrefix?: string;
  options: DocumentFormOptions;
}) {
  const prefix = fieldPrefix ? `${fieldPrefix}-` : "";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field id={`${prefix}title`} label="Titulo">
        <Input
          id={`${prefix}title`}
          name="title"
          required
          defaultValue={document?.title ?? ""}
          placeholder="Evidencia de check-in"
        />
      </Field>
      <Field id={`${prefix}mimeType`} label="Tipo MIME">
        <Input
          id={`${prefix}mimeType`}
          name="mimeType"
          defaultValue={document?.mimeType ?? "application/pdf"}
          placeholder="application/pdf"
        />
      </Field>
      <Field id={`${prefix}propertyId`} label="Propiedad">
        <SelectField
          id={`${prefix}propertyId`}
          name="propertyId"
          options={options.properties}
          placeholder="Sin propiedad directa"
          value={document?.propertyId}
        />
      </Field>
      <Field id={`${prefix}reservationId`} label="Reserva">
        <SelectField
          id={`${prefix}reservationId`}
          name="reservationId"
          options={options.reservations}
          placeholder="Sin reserva"
          value={document?.reservationId}
        />
      </Field>
      <Field id={`${prefix}incidentId`} label="Incidencia">
        <SelectField
          id={`${prefix}incidentId`}
          name="incidentId"
          options={options.incidents}
          placeholder="Sin incidencia"
          value={document?.incidentId}
        />
      </Field>
      <Field id={`${prefix}storagePath`} label="Ruta storage">
        <Input
          id={`${prefix}storagePath`}
          name="storagePath"
          required
          defaultValue={document?.storagePath ?? ""}
          placeholder="reservation-documents/res-1028/checkin.pdf"
        />
      </Field>
    </div>
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
