"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { directBookingInquirySchema } from "@wiahost/shared";

import {
  createDirectBookingInquiry,
  DirectBookingMutationError,
} from "@/lib/services/direct-booking";

function redirectWithError(slug: string, message: string): never {
  redirect(`/book/${slug}?error=${encodeURIComponent(message)}`);
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
      redirectWithError(slug, error.message);
    }

    redirectWithError(
      slug,
      "No se ha podido enviar la solicitud. Intentalo de nuevo.",
    );
  }

  revalidatePath("/reservations");
  revalidatePath("/leads");
  revalidatePath("/inbox");
  revalidatePath("/distribution");
  redirect(`/book/${slug}?sent=1`);
}
