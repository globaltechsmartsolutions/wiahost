import { describe, expect, it } from "vitest";

import {
  createDocumentDownloadUrl,
  createDocumentSignedUploadUrl,
  DocumentMutationError,
} from "./documents";

function createDocumentSupabaseMock(storagePath: string) {
  const storageCalls: Array<{
    bucket: string;
    expiresInSeconds?: number;
    path: string;
    upsert?: boolean;
    type: "download" | "upload";
  }> = [];

  return {
    storageCalls,
    supabase: {
      from() {
        return {
          eq() {
            return this;
          },
          select() {
            return this;
          },
          single() {
            return {
              data: {
                id: "doc-1",
                storage_path: storagePath,
                title: "Parte de incidencia",
              },
              error: null,
            };
          },
        };
      },
      storage: {
        from(bucket: string) {
          return {
            createSignedUploadUrl(path: string, options: { upsert: boolean }) {
              storageCalls.push({
                bucket,
                path,
                type: "upload",
                upsert: options.upsert,
              });

              return {
                data: {
                  path,
                  signedUrl: `https://storage.local/upload/${bucket}/${path}`,
                  token: "upload-token",
                },
                error: null,
              };
            },
            createSignedUrl(path: string, expiresInSeconds: number) {
              storageCalls.push({
                bucket,
                expiresInSeconds,
                path,
                type: "download",
              });

              return {
                data: {
                  signedUrl: `https://storage.local/download/${bucket}/${path}`,
                },
                error: null,
              };
            },
          };
        },
      },
    },
  };
}

describe("document services", () => {
  it("creates download URLs using the bucket embedded in the storage path", async () => {
    const { storageCalls, supabase } = createDocumentSupabaseMock(
      "incident-attachments/incidents/inc-1/photo.jpg",
    );

    const result = await createDocumentDownloadUrl(
      supabase as never,
      "doc-1",
      120,
    );

    expect(result).toMatchObject({
      bucket: "incident-attachments",
      expiresInSeconds: 120,
      path: "incidents/inc-1/photo.jpg",
      signedUrl:
        "https://storage.local/download/incident-attachments/incidents/inc-1/photo.jpg",
    });
    expect(storageCalls).toEqual([
      {
        bucket: "incident-attachments",
        expiresInSeconds: 120,
        path: "incidents/inc-1/photo.jpg",
        type: "download",
      },
    ]);
  });

  it("defaults upload URLs to reservation documents when no bucket is present", async () => {
    const { storageCalls, supabase } = createDocumentSupabaseMock(
      "guest-files/check-in.pdf",
    );

    const result = await createDocumentSignedUploadUrl(supabase as never, {
      storagePath: "guest-files/check-in.pdf",
      upsert: true,
    });

    expect(result).toMatchObject({
      bucket: "reservation-documents",
      path: "guest-files/check-in.pdf",
      signedUrl:
        "https://storage.local/upload/reservation-documents/guest-files/check-in.pdf",
      token: "upload-token",
      upsert: true,
    });
    expect(storageCalls).toEqual([
      {
        bucket: "reservation-documents",
        path: "guest-files/check-in.pdf",
        type: "upload",
        upsert: true,
      },
    ]);
  });

  it("rejects unsafe document storage paths before touching Storage", async () => {
    const { storageCalls, supabase } =
      createDocumentSupabaseMock("property-media/../secret.pdf");

    await expect(
      createDocumentDownloadUrl(supabase as never, "doc-1"),
    ).rejects.toMatchObject({
      code: "invalid_storage_path",
    } satisfies Partial<DocumentMutationError>);
    expect(storageCalls).toEqual([]);
  });
});
