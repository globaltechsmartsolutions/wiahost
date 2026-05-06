import { expect, test, type APIResponse } from "@playwright/test";

import { demoOperator, signInAsDemoOperator } from "./helpers";

async function expectApiError(
  response: APIResponse,
  expected: {
    code: string;
    status: number;
  },
) {
  expect(response.status()).toBe(expected.status);
  expect(response.headers()["x-request-id"]).toBeTruthy();

  const body = (await response.json()) as {
    error?: {
      code?: string;
      message?: string;
      requestId?: string;
    };
  };

  expect(body.error?.code).toBe(expected.code);
  expect(body.error?.message).toBeTruthy();
  expect(body.error?.requestId).toBe(response.headers()["x-request-id"]);
}

test.describe("API security and negative flows @security", () => {
  test("rejects anonymous access to protected operational APIs", async ({
    page,
  }) => {
    for (const endpoint of [
      "/api/reservations",
      "/api/tasks",
      "/api/incidents",
      "/api/payments",
      "/api/documents",
    ]) {
      const response = await page.request.get(endpoint);
      await expectApiError(response, {
        code: "unauthorized",
        status: 401,
      });
    }
  });

  test("returns consistent errors for invalid authenticated payloads", async ({
    page,
  }) => {
    await signInAsDemoOperator(page);

    const invalidJsonResponse = await page.evaluate(async () => {
      const response = await fetch("/api/tasks", {
        body: "{",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const body = (await response.json()) as {
        error?: { code?: string; requestId?: string };
      };

      return {
        body,
        requestId: response.headers.get("X-Request-Id"),
        status: response.status,
      };
    });

    expect(invalidJsonResponse.status).toBe(400);
    expect(invalidJsonResponse.requestId).toBeTruthy();
    expect(invalidJsonResponse.body.error?.code).toBe("invalid_json");
    expect(invalidJsonResponse.body.error?.requestId).toBe(
      invalidJsonResponse.requestId,
    );

    const invalidTaskResponse = await page.request.post("/api/tasks", {
      data: {
        priority: "critical",
        propertyId: "not-a-guid",
        status: "open",
        title: "",
        type: "cleaning",
      },
    });
    await expectApiError(invalidTaskResponse, {
      code: "validation_error",
      status: 422,
    });

    const invalidTaskIdResponse = await page.request.patch(
      "/api/tasks/not-a-guid/status",
      {
        data: {
          status: "done",
        },
      },
    );
    await expectApiError(invalidTaskIdResponse, {
      code: "invalid_task_id",
      status: 422,
    });
  });

  test("rejects unsafe document upload paths before touching storage", async ({
    page,
  }) => {
    await signInAsDemoOperator(page);

    const response = await page.request.post("/api/documents/upload-url", {
      data: {
        storagePath: "property-media/../secret.pdf",
        upsert: true,
      },
    });

    await expectApiError(response, {
      code: "validation_error",
      status: 422,
    });
  });

  test("keeps public payment and webhook endpoints defensive", async ({
    page,
  }) => {
    const invalidCheckoutResponse = await page.request.post(
      "/api/checkout/not-a-guid/confirm",
      {
        data: {
          token: "checkout-token-11111111-2222-4333-8444-555555555555",
        },
      },
    );
    await expectApiError(invalidCheckoutResponse, {
      code: "invalid_payment_id",
      status: 422,
    });

    const missingStripeSignatureResponse = await page.request.post(
      "/api/stripe/webhook",
      {
        data: {
          type: "checkout.session.completed",
        },
      },
    );
    await expectApiError(missingStripeSignatureResponse, {
      code: "stripe_signature_missing",
      status: 400,
    });
  });

  test("health endpoint stays useful without exposing secrets", async ({
    page,
  }) => {
    const response = await page.request.get("/api/health");
    expect([200, 503]).toContain(response.status());

    const bodyText = await response.text();
    const body = JSON.parse(bodyText) as {
      checks?: Array<{ key?: string; message?: string; status?: string }>;
      runtime?: { environment?: string; provider?: string };
      status?: string;
    };

    expect(body.status).toMatch(/^(ok|degraded|error)$/);
    expect(Array.isArray(body.checks)).toBe(true);
    expect(body.runtime?.provider).toBeTruthy();
    expect(bodyText).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(bodyText).not.toContain("STRIPE_SECRET_KEY");
    expect(bodyText).not.toContain("DATABASE_URL");
    expect(bodyText).not.toContain(demoOperator.password);
  });
});
