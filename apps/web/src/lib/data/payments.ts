import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Relation<T> = T | T[] | null | undefined;

type PaymentRow = {
  amount: number | string | null;
  currency: string;
  id: string;
  metadata?: unknown;
  paid_at: string | null;
  provider: string;
  provider_payment_id?: string | null;
  reservation_id: string;
  reservations?: Relation<{
    check_in: string | null;
    check_out: string | null;
    guests?: Relation<{ full_name: string | null }>;
    properties?: Relation<{ name: string | null }>;
  }>;
  status: string;
};

export type PaymentListItem = {
  amount: string;
  checkoutStatus: string;
  checkoutUrl: string | null;
  dates: string;
  guest: string;
  id: string;
  paidAt: string;
  property: string;
  provider: string;
  raw: {
    amount: number;
    currency: string;
    checkoutUrl: string | null;
    paidAt: string;
    provider: string;
    providerPaymentId: string | null;
    reservationId: string;
    status: string;
  };
  status: string;
};

const fallbackPayments: PaymentListItem[] = [
  {
    amount: "645 EUR",
    checkoutStatus: "Sin enlace",
    checkoutUrl: null,
    dates: "29 abr - 02 may",
    guest: "Sofia Martin",
    id: "demo-payment-1",
    paidAt: "Autorizado",
    property: "Atico Gran Via Sky",
    provider: "Airbnb",
    raw: {
      amount: 645,
      checkoutUrl: null,
      currency: "EUR",
      paidAt: "",
      provider: "airbnb",
      providerPaymentId: null,
      reservationId: "demo-reservation-1",
      status: "authorized",
    },
    status: "Autorizado",
  },
];

export const paymentStatusOptions = [
  { label: "Pendiente", value: "pending" },
  { label: "Autorizado", value: "authorized" },
  { label: "Pagado", value: "paid" },
  { label: "Reembolsado", value: "refunded" },
  { label: "Fallido", value: "failed" },
  { label: "Disputa", value: "disputed" },
];

function one<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation ?? null;
}

function money(value: number | string | null | undefined, currency = "EUR") {
  const numeric = Number(value ?? 0);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(safeValue)} ${currency}`;
}

function shortDate(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function dateRange(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
) {
  return `${shortDate(checkIn)} - ${shortDate(checkOut)}`;
}

function dateTimeInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}

function statusLabel(status: string) {
  return (
    paymentStatusOptions.find((option) => option.value === status)?.label ??
    status
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function checkoutFromMetadata(metadata: unknown) {
  const checkout = asRecord(asRecord(metadata).checkout);
  const url = typeof checkout.url === "string" ? checkout.url : null;
  const status = typeof checkout.status === "string" ? checkout.status : null;

  return {
    status:
      status === "paid"
        ? "Pagado"
        : status === "created"
          ? "Enlace listo"
          : "Sin enlace",
    url,
  };
}

function mapPayment(row: PaymentRow): PaymentListItem {
  const reservation = one(row.reservations);
  const checkout = checkoutFromMetadata(row.metadata);

  return {
    amount: money(row.amount, row.currency),
    checkoutStatus: checkout.status,
    checkoutUrl: checkout.url,
    dates: dateRange(reservation?.check_in, reservation?.check_out),
    guest: one(reservation?.guests)?.full_name ?? "Huesped sin asignar",
    id: row.id,
    paidAt: row.paid_at ? shortDate(row.paid_at) : "Sin pago confirmado",
    property: one(reservation?.properties)?.name ?? "Propiedad sin asignar",
    provider: row.provider,
    raw: {
      amount: Number(row.amount ?? 0),
      checkoutUrl: checkout.url,
      currency: row.currency,
      paidAt: dateTimeInput(row.paid_at),
      provider: row.provider,
      providerPaymentId: row.provider_payment_id ?? null,
      reservationId: row.reservation_id,
      status: row.status,
    },
    status: statusLabel(row.status),
  };
}

export async function getPayments(): Promise<PaymentListItem[]> {
  if (!isSupabaseConfigured()) {
    return fallbackPayments;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("payments")
      .select(
        "id,reservation_id,status,provider,provider_payment_id,amount,currency,paid_at,metadata,reservations(check_in,check_out,properties(name),guests(full_name))",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) {
      return fallbackPayments;
    }

    return (data as PaymentRow[]).map(mapPayment);
  } catch {
    return fallbackPayments;
  }
}

export async function getPaymentDetail(
  paymentId: string,
): Promise<PaymentListItem | null> {
  if (!isSupabaseConfigured()) {
    return fallbackPayments.find((payment) => payment.id === paymentId) ?? null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("payments")
      .select(
        "id,reservation_id,status,provider,provider_payment_id,amount,currency,paid_at,metadata,reservations(check_in,check_out,properties(name),guests(full_name))",
      )
      .eq("id", paymentId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapPayment(data as PaymentRow);
  } catch {
    return null;
  }
}

export type PublicCheckoutPayment = {
  amount: string;
  dates: string;
  guest: string;
  id: string;
  property: string;
  raw: {
    amount: number;
    currency: string;
    status: string;
  };
  status: string;
};

export async function getPublicCheckoutPayment(
  paymentId: string,
  token: string,
): Promise<PublicCheckoutPayment | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("payments")
      .select(
        "id,reservation_id,status,provider,provider_payment_id,amount,currency,paid_at,metadata,reservations(check_in,check_out,properties(name),guests(full_name))",
      )
      .eq("id", paymentId)
      .single();

    if (error || !data) {
      return null;
    }

    const checkout = asRecord(asRecord(data.metadata).checkout);
    if (checkout.token !== token) {
      return null;
    }

    const mapped = mapPayment(data as PaymentRow);

    return {
      amount: mapped.amount,
      dates: mapped.dates,
      guest: mapped.guest,
      id: mapped.id,
      property: mapped.property,
      raw: {
        amount: mapped.raw.amount,
        currency: mapped.raw.currency,
        status: mapped.raw.status,
      },
      status: mapped.status,
    };
  } catch {
    return null;
  }
}
