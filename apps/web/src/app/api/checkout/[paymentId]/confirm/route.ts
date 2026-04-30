import { NextResponse } from "next/server";
import { checkoutConfirmationSchema } from "@wiahost/shared";
import { z } from "zod";

import { parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  confirmDemoCheckoutPayment,
  PaymentMutationError,
} from "@/lib/services/payments";

type RouteContext = {
  params: Promise<{ paymentId: string }>;
};

const idSchema = z.guid();

export async function POST(request: Request, { params }: RouteContext) {
  const { paymentId } = await params;
  const validPaymentId = idSchema.safeParse(paymentId);

  if (!validPaymentId.success) {
    return apiError(
      "invalid_payment_id",
      "El identificador de pago no es valido.",
      422,
    );
  }

  const rateLimit = checkRateLimit(request, {
    limit: 10,
    namespace: `checkout_confirm:${validPaymentId.data}`,
    windowMs: 60_000,
  });

  if (!rateLimit.ok) {
    return rateLimit.response;
  }

  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = checkoutConfirmationSchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const payment = await confirmDemoCheckoutPayment(
      validPaymentId.data,
      parsed.data.token,
    );
    return NextResponse.json({ data: payment });
  } catch (error) {
    if (error instanceof PaymentMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "checkout_confirm_failed",
      "No se ha podido confirmar el pago.",
      400,
    );
  }
}
