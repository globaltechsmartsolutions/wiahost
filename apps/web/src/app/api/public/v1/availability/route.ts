import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/responses";
import {
  getPublicBookingListings,
  type PublicBookingListing,
} from "@/lib/data/direct-booking";
import {
  assertPropertyDateRangeAvailable,
  AvailabilityConflictError,
} from "@/lib/services/availability";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  checkPublicApiPartnerRateLimit,
  resolvePublicApiPartner,
} from "@/lib/public-api/partners";

function numberFromParam(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function partnerListing(listing: PublicBookingListing) {
  return {
    amenities: listing.amenities,
    available: true,
    bathrooms: listing.bathrooms,
    bedrooms: listing.bedrooms,
    bookingUrl: `/book/${listing.slug}`,
    city: listing.address,
    currency: "EUR",
    externalListingId: listing.externalListingId || null,
    id: listing.id,
    maxGuests: listing.maxGuests,
    name: listing.title,
    partnerId: listing.partnerId || null,
    publicSlug: listing.slug,
    rating: null,
    basePrice: listing.basePrice,
    cleaningFee: listing.cleaningFee,
    propertyId: listing.propertyId,
    thumbnailUrl: listing.thumbnailUrl,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const checkIn =
    url.searchParams.get("checkIn") ??
    url.searchParams.get("checkin") ??
    "";
  const checkOut =
    url.searchParams.get("checkOut") ??
    url.searchParams.get("checkout") ??
    "";

  if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || checkOut <= checkIn) {
    return apiError(
      "invalid_date_range",
      "La salida debe ser posterior a la entrada.",
      422,
    );
  }

  const destination = url.searchParams.get("destination") ?? undefined;
  const partner = url.searchParams.get("partner") ?? undefined;
  const partnerAuth = await resolvePublicApiPartner(request, {
    requestedPartner: partner,
  });

  if (!partnerAuth.ok) {
    return partnerAuth.response;
  }

  const rateLimit = checkPublicApiPartnerRateLimit(
    request,
    partnerAuth,
    "public_partner_availability",
  );

  if (!rateLimit.ok) {
    return rateLimit.response;
  }

  const guests = numberFromParam(
    url.searchParams.get("guests") ??
      url.searchParams.get("numberOfGuests"),
  );
  const listings = await getPublicBookingListings({
    destination,
    guests,
    partner: partnerAuth.partnerId || undefined,
  });

  if (!isSupabaseConfigured()) {
    const results = listings.map(partnerListing);

    return NextResponse.json({
      authMode: partnerAuth.authMode,
      ok: true,
      checkIn,
      checkOut,
      destination: destination ?? "",
      guests,
      partner: partnerAuth.partnerId,
      provider: "wiahost",
      total: results.length,
      results,
    });
  }

  const supabase = getSupabaseAdminClient();
  const availableListings: PublicBookingListing[] = [];

  for (const listing of listings) {
    try {
      await assertPropertyDateRangeAvailable(supabase, {
        checkIn,
        checkOut,
        propertyId: listing.propertyId,
      });
      availableListings.push(listing);
    } catch (error) {
      if (error instanceof AvailabilityConflictError) {
        continue;
      }

      return apiError(
        "availability_check_failed",
        "No se ha podido comprobar la disponibilidad.",
        502,
      );
    }
  }

  const results = availableListings.map(partnerListing);

  return NextResponse.json({
    authMode: partnerAuth.authMode,
    ok: true,
    checkIn,
    checkOut,
    destination: destination ?? "",
    guests,
    partner: partnerAuth.partnerId,
    provider: "wiahost",
    total: results.length,
    results,
  });
}
