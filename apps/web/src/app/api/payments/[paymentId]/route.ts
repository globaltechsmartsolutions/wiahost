import { NextResponse } from "next/server";
import { paymentSchema } from "@wiahost/shared";
import { z } from "zod";

import { getAuthenticatedApiContext, parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import { getPaymentDetail } from "@/lib/data/payments";
import {
  deletePayment,
  PaymentMutationError,
  updatePayment,
} from "@/lib/services/payments";

type RouteContext = {
  params: Promise<{ paymentId: string }>;
};

const idSchema = z.guid();

async function validPaymentId(params: RouteContext["params"]) {
  const { paymentId } = await params;
  const validId = idSchema.safeParse(paymentId);

  if (!validId.success) {
    return {
      error: apiError(
        "invalid_payment_id",
        "El identificador de pago no es valido.",
        422,
      ),
    };
  }

  return { paymentId: validId.data };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validPaymentId(params);

  if ("error" in result) {
    return result.error;
  }

  const payment = await getPaymentDetail(result.paymentId);

  if (!payment) {
    return apiError("payment_not_found", "Pago no encontrado.", 404);
  }

  return NextResponse.json({ data: payment });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validPaymentId(params);

  if ("error" in result) {
    return result.error;
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
    const payment = await updatePayment(
      context.supabase,
      result.paymentId,
      parsed.data,
    );
    return NextResponse.json({ data: payment });
  } catch (error) {
    if (error instanceof PaymentMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "payment_update_failed",
      "No se ha podido actualizar el pago.",
      400,
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedApiContext();

  if (!context.ok) {
    return context.response;
  }

  const result = await validPaymentId(params);

  if ("error" in result) {
    return result.error;
  }

  try {
    const payment = await deletePayment(context.supabase, result.paymentId);
    return NextResponse.json({ data: payment });
  } catch (error) {
    if (error instanceof PaymentMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "payment_delete_failed",
      "No se ha podido eliminar el pago.",
      400,
    );
  }
}
