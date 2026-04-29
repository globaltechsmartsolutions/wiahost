import { describe, expect, it } from "vitest";

import {
  extractTemplateVariables,
  renderMessageTemplate,
  templatePreviewContext,
} from "./template";

describe("message template rendering", () => {
  it("renders supported placeholders with a preview context", () => {
    const rendered = renderMessageTemplate(
      "Hola {{guest_name}}, llegada a {{property_name}} el {{checkin_date}}.",
      templatePreviewContext,
    );

    expect(rendered.rendered).toContain("Sofia Martin");
    expect(rendered.rendered).toContain("Atico Gran Via Sky");
    expect(rendered.usedVariables).toEqual([
      "guest_name",
      "property_name",
      "checkin_date",
    ]);
    expect(rendered.missingVariables).toEqual([]);
  });

  it("keeps unknown placeholders visible unless a fallback is provided", () => {
    const rendered = renderMessageTemplate("Codigo {{smart_lock_code}}", {});
    const withFallback = renderMessageTemplate(
      "Codigo {{smart_lock_code}}",
      {},
      { fallback: "[pendiente]" },
    );

    expect(rendered.rendered).toBe("Codigo {{smart_lock_code}}");
    expect(rendered.missingVariables).toEqual(["smart_lock_code"]);
    expect(withFallback.rendered).toBe("Codigo [pendiente]");
  });

  it("extracts unique variables regardless of whitespace", () => {
    expect(
      extractTemplateVariables(
        "{{ guest_name }} llega a {{property_name}}. Hola {{guest_name}}",
      ),
    ).toEqual(["guest_name", "property_name"]);
  });
});
