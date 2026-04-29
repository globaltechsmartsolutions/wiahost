"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2 } from "lucide-react";

import {
  buildDocumentStoragePath,
  documentUploadAccept,
  documentUploadBuckets,
  maxDocumentUploadBytes,
  titleFromDocumentFileName,
  type DocumentUploadBucket,
} from "@/lib/documents/upload";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { helper?: string; id: string; label: string };

type DocumentUploadFormProps = {
  options: {
    incidents: Option[];
    properties: Option[];
    reservations: Option[];
  };
};

type UploadUrlResponse = {
  data?: {
    bucket: DocumentUploadBucket;
    path: string;
    token: string;
  };
  error?: { message?: string };
};

const bucketLabels: Record<DocumentUploadBucket, string> = {
  "incident-attachments": "Adjunto de incidencia",
  "property-media": "Foto de propiedad",
  "reservation-documents": "Documento de reserva",
};

async function readApiError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: { message?: string } };
    return payload.error?.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function DocumentUploadForm({ options }: DocumentUploadFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [bucket, setBucket] = useState<DocumentUploadBucket>(
    "reservation-documents",
  );
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setError(null);
    setSuccess(null);

    if (selectedFile && !title.trim()) {
      setTitle(titleFromDocumentFileName(selectedFile.name));
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError("Selecciona un archivo antes de subir la evidencia.");
      return;
    }

    if (file.size > maxDocumentUploadBytes) {
      setError("El archivo supera el limite de 50 MB.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const storagePath = buildDocumentStoragePath({
        bucket,
        fileName: file.name,
      });

      const uploadUrlResponse = await fetch("/api/documents/upload-url", {
        body: JSON.stringify({ storagePath, upsert: false }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!uploadUrlResponse.ok) {
        throw new Error(
          await readApiError(
            uploadUrlResponse,
            "No se ha podido preparar la subida segura.",
          ),
        );
      }

      const uploadUrl = (await uploadUrlResponse.json()) as UploadUrlResponse;

      if (!uploadUrl.data?.token || !uploadUrl.data.path) {
        throw new Error("La subida segura no ha devuelto un token valido.");
      }

      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from(uploadUrl.data.bucket)
        .uploadToSignedUrl(uploadUrl.data.path, uploadUrl.data.token, file, {
          contentType: file.type || "application/octet-stream",
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const metadataResponse = await fetch("/api/documents", {
        body: JSON.stringify({
          incidentId: formData.get("incidentId") || undefined,
          mimeType: file.type || formData.get("mimeType") || undefined,
          propertyId: formData.get("propertyId") || undefined,
          reservationId: formData.get("reservationId") || undefined,
          storagePath,
          title: title.trim(),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!metadataResponse.ok) {
        throw new Error(
          await readApiError(
            metadataResponse,
            "El archivo ha subido, pero no se ha podido registrar el documento.",
          ),
        );
      }

      formRef.current?.reset();
      setFile(null);
      setTitle("");
      setSuccess("Archivo subido y documento registrado correctamente.");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se ha podido subir el documento.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-4">
      <div className="rounded-3xl border border-[#dfd2bf] bg-white/55 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#d8ff5f] text-[#160f09]">
            <FileUp className="size-5" />
          </div>
          <div>
            <p className="font-semibold">Subida segura a Storage</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              El navegador solo recibe un token temporal. La ruta queda
              registrada despues con el contexto operativo.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}

      <Field id="uploadFile" label="Archivo">
        <Input
          accept={documentUploadAccept}
          id="uploadFile"
          name="file"
          onChange={onFileChange}
          required
          type="file"
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field id="uploadTitle" label="Titulo">
          <Input
            id="uploadTitle"
            name="title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Evidencia de check-in"
            required
            value={title}
          />
        </Field>
        <Field id="uploadBucket" label="Tipo de archivo">
          <select
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            id="uploadBucket"
            name="bucket"
            onChange={(event) =>
              setBucket(event.target.value as DocumentUploadBucket)
            }
            value={bucket}
          >
            {documentUploadBuckets.map((bucketOption) => (
              <option key={bucketOption} value={bucketOption}>
                {bucketLabels[bucketOption]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field id="uploadPropertyId" label="Propiedad">
          <SelectField
            id="uploadPropertyId"
            name="propertyId"
            options={options.properties}
            placeholder="Sin propiedad"
          />
        </Field>
        <Field id="uploadReservationId" label="Reserva">
          <SelectField
            id="uploadReservationId"
            name="reservationId"
            options={options.reservations}
            placeholder="Sin reserva"
          />
        </Field>
        <Field id="uploadIncidentId" label="Incidencia">
          <SelectField
            id="uploadIncidentId"
            name="incidentId"
            options={options.incidents}
            placeholder="Sin incidencia"
          />
        </Field>
      </div>

      <Button className="rounded-full" disabled={isUploading} type="submit">
        {isUploading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Subiendo archivo...
          </>
        ) : (
          "Subir y registrar documento"
        )}
      </Button>
    </form>
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
  options: Option[];
  placeholder: string;
}) {
  return (
    <select
      className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
      id={id}
      name={name}
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
