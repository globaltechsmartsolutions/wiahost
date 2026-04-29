export const documentUploadBuckets = [
  "reservation-documents",
  "incident-attachments",
  "property-media",
] as const;

export const documentUploadAccept =
  "application/pdf,image/jpeg,image/png,image/webp";

export const maxDocumentUploadBytes = 50 * 1024 * 1024;

export type DocumentUploadBucket = (typeof documentUploadBuckets)[number];

export function sanitizeDocumentFileName(fileName: string) {
  const normalized = fileName
    .replace(/º/g, "o")
    .replace(/ª/g, "a")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const safeName = normalized
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safeName || "documento";
}

export function titleFromDocumentFileName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension.replace(/[-_]+/g, " ").trim();

  return normalized || "Documento operativo";
}

export function buildDocumentStoragePath({
  bucket,
  fileName,
  now = new Date(),
}: {
  bucket: DocumentUploadBucket;
  fileName: string;
  now?: Date;
}) {
  const timestamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "z");

  return `${bucket}/uploads/${timestamp}-${sanitizeDocumentFileName(fileName)}`;
}
