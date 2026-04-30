import { describe, expect, it } from "vitest";

import { securityHeaders } from "../../../security-headers";

describe("security headers", () => {
  const headers = new Map<string, string>(
    securityHeaders.map((header) => [header.key, header.value]),
  );

  it("sets clickjacking, MIME sniffing and referrer protections", () => {
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
  });

  it("uses a report-only CSP while integrations are still being validated", () => {
    const csp = headers.get("Content-Security-Policy-Report-Only");

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("https://checkout.stripe.com");
    expect(headers.has("Content-Security-Policy")).toBe(false);
  });

  it("keeps browser capabilities closed by default", () => {
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
    expect(headers.get("Permissions-Policy")).toContain("microphone=()");
    expect(headers.get("Permissions-Policy")).toContain("geolocation=()");
  });
});
