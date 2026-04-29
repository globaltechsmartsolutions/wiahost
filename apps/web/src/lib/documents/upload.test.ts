import { describe, expect, it } from "vitest";

import {
  buildDocumentStoragePath,
  sanitizeDocumentFileName,
  titleFromDocumentFileName,
} from "./upload";

describe("document upload helpers", () => {
  it("sanitizes file names for Supabase Storage paths", () => {
    expect(sanitizeDocumentFileName("Acta Check-in Nº 1.pdf")).toBe(
      "acta-check-in-no-1.pdf",
    );
    expect(sanitizeDocumentFileName("   ")).toBe("documento");
  });

  it("builds stable storage paths with bucket prefix", () => {
    expect(
      buildDocumentStoragePath({
        bucket: "reservation-documents",
        fileName: "Check In.pdf",
        now: new Date("2026-04-29T10:30:00.000Z"),
      }),
    ).toBe("reservation-documents/uploads/20260429T103000z-check-in.pdf");
  });

  it("creates readable default titles from file names", () => {
    expect(titleFromDocumentFileName("parte-incidencia_final.pdf")).toBe(
      "parte incidencia final",
    );
  });
});
