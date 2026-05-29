import { NextResponse } from "next/server";

import {
  getPublicBookingListings,
  type PublicBookingListing,
} from "@/lib/data/direct-booking";
import {
  checkPublicApiPartnerRateLimit,
  resolvePublicApiPartner,
} from "@/lib/public-api/partners";

function numberFromParam(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function partnerListing(listing: PublicBookingListing) {
  return {
    amenities: listing.amenities,
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
    "public_partner_listings",
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
  const results = listings.map(partnerListing);

  return NextResponse.json({
    authMode: partnerAuth.authMode,
    ok: true,
    partner: partnerAuth.partnerId,
    provider: "wiahost",
    total: results.length,
    results,
  });
}
