import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedApiContext } from "@/lib/api/context";
import { apiError } from "@/lib/api/responses";
import {
  createPaymentCheckoutLink,
  PaymentMutationError,
} from "@/lib/services/payments";

type RouteContext = {
  params: Promise<{ paymentId: string }>;
};

const idSchema = z.guid();

export async function POST(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const { paymentId } = await params;
  const validPaymentId = idSchema.safeParse(paymentId);

  if (!validPaymentId.success) {
    return apiError(
      "invalid_payment_id",
      "El identificador de pago no es valido.",
      422,
    );
  }

  try {
    const checkout = await createPaymentCheckoutLink(
      context.supabase,
      validPaymentId.data,
    );
    return NextResponse.json({ data: checkout }, { status: 201 });
  } catch (error) {
    if (error instanceof PaymentMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "payment_checkout_link_failed",
      "No se ha podido generar el enlace de cobro.",
      400,
    );
  }
}
