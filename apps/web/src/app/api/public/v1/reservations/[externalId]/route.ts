import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/responses";
import {
  checkPublicApiPartnerRateLimit,
  resolvePublicApiPartner,
} from "@/lib/public-api/partners";
import {
  DirectBookingMutationError,
  getDirectBookingInquiryStatus,
} from "@/lib/services/direct-booking";

type RouteContext = {
  params: Promise<{
    externalId: string;
  }>;
};

function stringField(value: string | null | undefined) {
  return String(value ?? "").trim();
}

export async function GET(request: Request, { params }: RouteContext) {
  const url = new URL(request.url);
  const partnerAuth = await resolvePublicApiPartner(request, {
    requestedPartner: url.searchParams.get("partner"),
  });

  if (!partnerAuth.ok) {
    return partnerAuth.response;
  }

  const rateLimit = checkPublicApiPartnerRateLimit(
    request,
    partnerAuth,
    "public_partner_reservation_status",
  );

  if (!rateLimit.ok) {
    return rateLimit.response;
  }

  if (!partnerAuth.partnerId) {
    return apiError(
      "public_partner_required",
      "Debes indicar el partner para consultar esta solicitud.",
      422,
    );
  }

  const { externalId } = await params;
  const cleanExternalId = stringField(decodeURIComponent(externalId));

  if (!cleanExternalId) {
    return apiError(
      "external_reservation_id_required",
      "Debes indicar el identificador externo de la solicitud.",
      422,
    );
  }

  try {
    const inquiry = await getDirectBookingInquiryStatus({
      externalId: cleanExternalId,
      partnerId: partnerAuth.partnerId,
    });

    if (!inquiry) {
      return apiError(
        "public_reservation_not_found",
        "No se ha encontrado la solicitud indicada para este partner.",
        404,
      );
    }

    return NextResponse.json({
      authMode: partnerAuth.authMode,
      ok: true,
      partner: partnerAuth.partnerId,
      data: inquiry,
    });
  } catch (error) {
    if (error instanceof DirectBookingMutationError) {
      return apiError(error.code, error.message, 400);
    }

    return apiError(
      "public_reservation_status_failed",
      "No se ha podido consultar el estado de la solicitud.",
      400,
    );
  }
}
