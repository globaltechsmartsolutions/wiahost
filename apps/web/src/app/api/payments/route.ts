import { NextResponse } from "next/server";
import { paymentSchema } from "@wiahost/shared";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getPayments } from "@/lib/data/payments";
import { createPayment, PaymentMutationError } from "@/lib/services/payments";

export async function GET() {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const payments = await getPayments();
  return NextResponse.json({ data: payments });
}

export async function POST(request: Request) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = paymentSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const payment = await createPayment(context.supabase, parsed.data);
    return NextResponse.json({ data: payment }, { status: 201 });
  } catch (error) {
    if (error instanceof PaymentMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "payment_create_failed",
      "No se ha podido crear el pago.",
      400,
    );
  }
}
