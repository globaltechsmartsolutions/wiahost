"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { directBookingInquirySchema } from "@wiahost/shared";

import {
  createDirectBookingInquiry,
  DirectBookingMutationError,
} from "@/lib/services/direct-booking";

type BookingRedirectValues = {
  checkIn?: string;
  checkOut?: string;
  guestsCount?: number;
};

function bookingRedirectPath(
  slug: string,
  values: BookingRedirectValues,
  status: { error?: string; sent?: boolean },
) {
  const params = new URLSearchParams();

  if (status.sent) {
    params.set("sent", "1");
  }

  if (status.error) {
    params.set("error", status.error);
  }

  if (values.checkIn) {
    params.set("checkIn", values.checkIn);
  }

  if (values.checkOut) {
    params.set("checkOut", values.checkOut);
  }

  if (values.guestsCount) {
    params.set("guests", String(values.guestsCount));
  }

  const query = params.toString();

  return query ? `/book/${slug}?${query}` : `/book/${slug}`;
}

function redirectWithError(
  slug: string,
  message: string,
  values: BookingRedirectValues = {},
): never {
  redirect(bookingRedirectPath(slug, values, { error: message }));
}

function inputFromForm(formData: FormData) {
  return {
    checkIn: formData.get("checkIn"),
    checkOut: formData.get("checkOut"),
    consent: formData.get("consent") === "on",
    guestEmail: formData.get("guestEmail"),
    guestFullName: formData.get("guestFullName"),
    guestPhone: formData.get("guestPhone"),
    guestsCount: formData.get("guestsCount"),
    message: formData.get("message"),
  };
}

export async function createDirectBookingInquiryAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();

  if (!slug) {
    redirect("/?error=Anuncio no valido.");
  }

  const parsed = directBookingInquirySchema.safeParse(inputFromForm(formData));

  if (!parsed.success) {
    redirectWithError(
      slug,
      parsed.error.issues[0]?.message ?? "Solicitud no valida.",
    );
  }

  try {
    await createDirectBookingInquiry(slug, parsed.data);
  } catch (error) {
    if (error instanceof DirectBookingMutationError) {
      redirectWithError(slug, error.message, parsed.data);
    }

    redirectWithError(
      slug,
      "No se ha podido enviar la solicitud. Intentalo de nuevo.",
      parsed.data,
    );
  }

  revalidatePath("/reservations");
  revalidatePath("/leads");
  revalidatePath("/inbox");
  revalidatePath("/distribution");
  redirect(bookingRedirectPath(slug, parsed.data, { sent: true }));
}
