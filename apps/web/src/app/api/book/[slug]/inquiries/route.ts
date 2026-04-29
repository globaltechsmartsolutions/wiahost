import { NextResponse } from "next/server";
import { directBookingInquirySchema } from "@wiahost/shared";

import { parseJsonBody } from "@/lib/api/context";
import { apiError, validationError } from "@/lib/api/responses";
import {
  createDirectBookingInquiry,
  DirectBookingMutationError,
} from "@/lib/services/direct-booking";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const json = await parseJsonBody(request);

  if (!json.ok) {
    return json.response;
  }

  const parsed = directBookingInquirySchema.safeParse(json.body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const inquiry = await createDirectBookingInquiry(slug, parsed.data);
    return NextResponse.json({ data: inquiry }, { status: 201 });
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
