import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const paymentServiceMocks = vi.hoisted(() => ({
  adminClient: null as unknown,
  stripeConfigured: false,
  stripeSessionCreate: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => paymentServiceMocks.adminClient,
}));

vi.mock("@/lib/stripe/server", () => ({
  getStripeClient: () => ({
    checkout: {
      sessions: {
        create: paymentServiceMocks.stripeSessionCreate,
      },
    },
  }),
  isStripeConfigured: () => paymentServiceMocks.stripeConfigured,
}));

import {
  confirmDemoCheckoutPayment,
  confirmStripeCheckoutPayment,
  createPaymentCheckoutLink,
  PaymentMutationError,
} from "./payments";

type PaymentRow = {
  amount: number;
  currency: string;
  id: string;
  metadata: Record<string, unknown>;
  provider_payment_id?: string | null;
  reservation_id: string;
  reservations: {
    guests?: { email?: string; full_name?: string };
    property_id: string;
    properties?: { name?: string };
    status?: string;
  };
  status: string;
};

function createPaymentRow(overrides: Partial<PaymentRow> = {}): PaymentRow {
  return {
    amount: 420,
    currency: "EUR",
    id: "12345678-aaaa-4bbb-8ccc-123456789abc",
    metadata: {},
    provider_payment_id: null,
    reservation_id: "reservation-1",
    reservations: {
      guests: {
        email: "sofia@example.com",
        full_name: "Sofia Martin",
      },
      properties: {
        name: "Atico Gran Via Sky",
      },
      property_id: "property-1",
      status: "pending",
    },
    status: "pending",
    ...overrides,
  };
}

function createPaymentsSupabaseMock(payment: PaymentRow) {
  const inserts: Record<string, unknown[]> = {};
  const updates: Record<string, unknown[]> = {};
  const filters: Record<string, unknown[]> = {};

  class QueryBuilder {
    private operation: "select" | "update" | "insert" = "select";
    private payload: unknown;

    constructor(private readonly table: string) {}

    select() {
      return this;
    }

    insert(payload: unknown) {
      this.operation = "insert";
      this.payload = payload;
      inserts[this.table] = inserts[this.table] ?? [];
      inserts[this.table]!.push(payload);
      return this;
    }

    update(payload: unknown) {
      this.operation = "update";
      this.payload = payload;
      updates[this.table] = updates[this.table] ?? [];
      updates[this.table]!.push(payload);
      return this;
    }

    eq(column: string, value: unknown) {
      filters[this.table] = filters[this.table] ?? [];
      filters[this.table]!.push({ column, value });
      return this;
    }

    in(column: string, value: unknown) {
      filters[this.table] = filters[this.table] ?? [];
      filters[this.table]!.push({ column, value });
      return this;
    }

    single() {
      if (this.table === "payments" && this.operation === "select") {
        return { data: payment, error: null };
      }

      if (this.table === "payments" && this.operation === "update") {
        const payload = this.payload as {
          provider_payment_id?: string;
          status?: string;
        };

        return {
          data: {
            id: payment.id,
            provider_payment_id:
              payload.provider_payment_id ?? payment.provider_payment_id,
            status: payload.status ?? payment.status,
          },
          error: null,
        };
      }

      return { data: null, error: null };
    }
  }

  return {
    filters,
    inserts,
    supabase: {
      from(table: string) {
        return new QueryBuilder(table);
      },
    },
    updates,
  };
}

describe("payment services", () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://demo.wiahost.test";
    paymentServiceMocks.adminClient = null;
    paymentServiceMocks.stripeConfigured = false;
    paymentServiceMocks.stripeSessionCreate.mockReset();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it("creates a demo checkout link when Stripe is not configured", async () => {
    const { inserts, supabase, updates } = createPaymentsSupabaseMock(
      createPaymentRow(),
    );

    const result = await createPaymentCheckoutLink(supabase as never, "pay-1");

    expect(result).toMatchObject({
      paymentId: "12345678-aaaa-4bbb-8ccc-123456789abc",
      provider: "direct_checkout",
      providerPaymentId: "demo_checkout_12345678",
      status: "pending",
    });
    expect(result.checkoutUrl).toMatch(
      /^https:\/\/demo\.wiahost\.test\/checkout\/12345678-aaaa-4bbb-8ccc-123456789abc\?token=checkout-token-/,
    );
    expect(updates.payments).toHaveLength(1);
    expect(updates.payments![0]).toMatchObject({
      provider: "direct_checkout",
      provider_payment_id: "demo_checkout_12345678",
    });
    expect(updates.payments![0]).toMatchObject({
      metadata: {
        checkout: {
          demoUrl: expect.stringContaining("/checkout/"),
          mode: "demo_checkout",
          provider: "stripe_ready",
          status: "created",
          url: result.checkoutUrl,
        },
      },
    });
    expect(inserts.channel_sync_events).toEqual([
      {
        channel: "direct",
        direction: "outbound",
        payload: {
          action: "direct_checkout_link_created",
          amount: 420,
          paymentId: "12345678-aaaa-4bbb-8ccc-123456789abc",
          reservationId: "reservation-1",
          source: "direct_checkout",
        },
        property_id: "property-1",
        status: "pending",
      },
    ]);
  });

  it("creates a Stripe Checkout session when Stripe is configured", async () => {
    paymentServiceMocks.stripeConfigured = true;
    paymentServiceMocks.stripeSessionCreate.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/c/pay/cs_test_123",
    });

    const { inserts, supabase, updates } = createPaymentsSupabaseMock(
      createPaymentRow({ amount: 154.32 }),
    );

    const result = await createPaymentCheckoutLink(supabase as never, "pay-1");

    expect(paymentServiceMocks.stripeSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        client_reference_id: "12345678-aaaa-4bbb-8ccc-123456789abc",
        customer_email: "sofia@example.com",
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              currency: "eur",
              unit_amount: 15432,
            }),
          }),
        ],
        metadata: {
          paymentId: "12345678-aaaa-4bbb-8ccc-123456789abc",
          reservationId: "reservation-1",
        },
        mode: "payment",
      }),
    );
    expect(result).toMatchObject({
      checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_123",
      provider: "stripe",
      providerPaymentId: "cs_test_123",
    });
    expect(updates.payments![0]).toMatchObject({
      provider: "stripe",
      provider_payment_id: "cs_test_123",
    });
    expect(inserts.channel_sync_events![0]).toMatchObject({
      payload: {
        action: "stripe_checkout_session_created",
        amount: 154.32,
        paymentId: "12345678-aaaa-4bbb-8ccc-123456789abc",
        reservationId: "reservation-1",
        source: "direct_checkout",
      },
      status: "pending",
    });
  });

  it("rejects demo checkout confirmation when the token does not match", async () => {
    const { supabase, updates } = createPaymentsSupabaseMock(
      createPaymentRow({
        metadata: {
          checkout: {
            token: "checkout-token-valid-token",
          },
        },
      }),
    );
    paymentServiceMocks.adminClient = supabase;

    await expect(
      confirmDemoCheckoutPayment(
        "12345678-aaaa-4bbb-8ccc-123456789abc",
        "checkout-token-wrong-token",
      ),
    ).rejects.toMatchObject({
      code: "checkout_token_invalid",
    } satisfies Partial<PaymentMutationError>);
    expect(updates.payments).toBeUndefined();
  });

  it("does not double-process already paid demo checkout confirmations", async () => {
    const { inserts, supabase, updates } = createPaymentsSupabaseMock(
      createPaymentRow({
        metadata: {
          checkout: {
            status: "paid",
            token: "checkout-token-valid-token",
          },
        },
        status: "paid",
      }),
    );
    paymentServiceMocks.adminClient = supabase;

    const result = await confirmDemoCheckoutPayment(
      "12345678-aaaa-4bbb-8ccc-123456789abc",
      "checkout-token-valid-token",
    );

    expect(result).toEqual({
      id: "12345678-aaaa-4bbb-8ccc-123456789abc",
      status: "paid",
    });
    expect(updates.payments).toBeUndefined();
    expect(updates.reservations).toBeUndefined();
    expect(inserts.channel_sync_events).toBeUndefined();
  });

  it("confirms Stripe payments and moves pending reservations to confirmed", async () => {
    const { filters, inserts, supabase, updates } = createPaymentsSupabaseMock(
      createPaymentRow({
        metadata: {
          checkout: {
            status: "created",
            token: "checkout-token-valid-token",
          },
        },
      }),
    );
    paymentServiceMocks.adminClient = supabase;

    const result = await confirmStripeCheckoutPayment(
      "12345678-aaaa-4bbb-8ccc-123456789abc",
      "cs_test_123",
    );

    expect(result).toEqual({
      id: "12345678-aaaa-4bbb-8ccc-123456789abc",
      provider_payment_id: "cs_test_123",
      status: "paid",
    });
    expect(updates.payments![0]).toMatchObject({
      provider: "stripe",
      provider_payment_id: "cs_test_123",
      status: "paid",
    });
    expect(updates.payments![0]).toMatchObject({
      metadata: {
        checkout: {
          provider: "stripe",
          providerPaymentId: "cs_test_123",
          status: "paid",
        },
      },
    });
    expect(updates.reservations).toEqual([{ status: "confirmed" }]);
    expect(filters.reservations).toContainEqual({
      column: "id",
      value: "reservation-1",
    });
    expect(filters.reservations).toContainEqual({
      column: "status",
      value: ["inquiry", "pending"],
    });
    expect(inserts.channel_sync_events![0]).toMatchObject({
      payload: {
        action: "stripe_checkout_paid",
        amount: 420,
        paymentId: "12345678-aaaa-4bbb-8ccc-123456789abc",
        reservationId: "reservation-1",
        source: "direct_checkout",
      },
      status: "synced",
    });
  });

  it("does not double-process duplicate Stripe webhook deliveries", async () => {
    const { inserts, supabase, updates } = createPaymentsSupabaseMock(
      createPaymentRow({
        metadata: {
          checkout: {
            provider: "stripe",
            providerPaymentId: "cs_test_123",
            status: "paid",
          },
        },
        provider_payment_id: "cs_test_123",
        status: "paid",
      }),
    );
    paymentServiceMocks.adminClient = supabase;

    const result = await confirmStripeCheckoutPayment(
      "12345678-aaaa-4bbb-8ccc-123456789abc",
      "cs_test_123",
    );

    expect(result).toEqual({
      id: "12345678-aaaa-4bbb-8ccc-123456789abc",
      provider_payment_id: "cs_test_123",
      status: "paid",
    });
    expect(updates.payments).toBeUndefined();
    expect(updates.reservations).toBeUndefined();
    expect(inserts.channel_sync_events).toBeUndefined();
  });
});
