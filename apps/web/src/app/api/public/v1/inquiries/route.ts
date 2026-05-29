import { NextResponse } from "next/server";
import { directBookingInquirySchema } from "@wiahost/shared";

import { parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import {
  createDirectBookingInquiry,
  DirectBookingMutationError,
} from "@/lib/services/direct-booking";
import {
  checkPublicApiPartnerRateLimit,
  resolvePublicApiPartner,
} from "@/lib/public-api/partners";

function stringField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function idempotencyKey(request: Request, body: Record<string, unknown>) {
  return (
    stringField(request.headers.get("Idempotency-Key")) ||
    stringField(request.headers.get("X-Idempotency-Key")) ||
    stringField(body.idempotencyKey)
  );
}

export async function POST(request: Request) {
  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const body = json.body as Record<string, unknown>;
  const slug = stringField(body.slug ?? body.publicSlug);
  const partner = stringField(
    body.partner ?? body.partnerId,
  );
  const idempotency = idempotencyKey(request, body);
  const partnerAuth = await resolvePublicApiPartner(request, {
    requestedPartner: partner,
  });

  if (!partnerAuth.ok) {
    return partnerAuth.response;
  }

  const rateLimit = checkPublicApiPartnerRateLimit(
    request,
    partnerAuth,
    "public_partner_inquiry",
  );

  if (!rateLimit.ok) {
    return rateLimit.response;
  }

  if (!slug) {
    return apiError(
      "booking_listing_not_found",
      "No se ha indicado el anuncio de reserva.",
      422,
    );
  }

  if (!idempotency) {
    return apiError(
      "idempotency_key_required",
      "Las solicitudes de partner deben incluir Idempotency-Key.",
      422,
    );
  }

  const parsed = directBookingInquirySchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const inquiry = await createDirectBookingInquiry(slug, parsed.data, {
      idempotencyKey: idempotency,
      partnerId: partnerAuth.partnerId || undefined,
      source: "partner_channel_api",
    });

    return NextResponse.json(
      {
        authMode: partnerAuth.authMode,
        idempotentReplay: inquiry.idempotentReplay,
        ok: true,
        partner: partnerAuth.partnerId,
        data: inquiry,
      },
      { status: inquiry.idempotentReplay ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof DirectBookingMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "direct_booking_create_failed",
      "No se ha podido crear la solicitud de reserva.",
      400,
    );
  }
}
