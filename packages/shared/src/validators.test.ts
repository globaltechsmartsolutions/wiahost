import { describe, expect, it } from "vitest";

import {
  incidentSchema,
  loginSchema,
  propertySchema,
  registerSchema,
  reservationSchema,
} from "./validators";

const uuid = "11111111-1111-4111-8111-111111111111";

describe("auth validators", () => {
  it("accepts a valid login payload", () => {
    const parsed = loginSchema.safeParse({
      email: "operaciones@wiahost.local",
      password: "Password123!",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects weak registration passwords", () => {
    const parsed = registerSchema.safeParse({
      fullName: "Laura Operaciones",
      email: "laura@wiahost.local",
      password: "short",
      role: "operator",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("property validators", () => {
  it("coerces numeric form values and applies defaults", () => {
    const parsed = propertySchema.parse({
      name: "Atico Gran Via Sky",
      addressLine: "Gran Via 28",
      city: "Madrid",
      bedrooms: "2",
      bathrooms: "1.5",
      maxGuests: "4",
      basePrice: "180",
      cleaningFee: "45",
    });

    expect(parsed.bedrooms).toBe(2);
    expect(parsed.bathrooms).toBe(1.5);
    expect(parsed.status).toBe("draft");
  });

  it("rejects properties without a city", () => {
    const parsed = propertySchema.safeParse({
      name: "Loft Malaga Centro",
      addressLine: "Calle Centro 4",
      city: "",
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      basePrice: 120,
    });

    expect(parsed.success).toBe(false);
  });
});

describe("reservation validators", () => {
  it("accepts a manual confirmed reservation", () => {
    const parsed = reservationSchema.safeParse({
      propertyId: uuid,
      guestId: uuid,
      channel: "manual",
      checkIn: "2026-05-01",
      checkOut: "2026-05-04",
      guestsCount: 2,
      nightlyRate: 150,
      totalAmount: 450,
    });

    expect(parsed.success).toBe(true);
  });
});

describe("incident validators", () => {
  it("rejects short incident descriptions", () => {
    const parsed = incidentSchema.safeParse({
      propertyId: uuid,
      title: "AC",
      description: "ruido",
      severity: "medium",
    });

    expect(parsed.success).toBe(false);
  });
});
