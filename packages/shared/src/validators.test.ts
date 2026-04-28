import { describe, expect, it } from "vitest";

import {
  aiAuditLogSchema,
  incidentSchema,
  loginSchema,
  manualReservationSchema,
  messageLabelSchema,
  modelPredictionSchema,
  operationalEventSchema,
  propertySchema,
  qualityAuditMemorySchema,
  registerSchema,
  reservationSchema,
  taskSchema,
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

  it("accepts a manual reservation form without a pre-existing guest", () => {
    const parsed = manualReservationSchema.safeParse({
      propertyId: uuid,
      guestFullName: "Sofia Martin",
      guestEmail: "sofia@example.com",
      channel: "manual",
      checkIn: "2026-05-01",
      checkOut: "2026-05-04",
      guestsCount: "2",
      nightlyRate: "150",
      cleaningFee: "45",
      taxesAmount: "0",
      securityDeposit: "200",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects a reservation whose check-out is before check-in", () => {
    const parsed = manualReservationSchema.safeParse({
      propertyId: uuid,
      guestFullName: "Sofia Martin",
      channel: "manual",
      checkIn: "2026-05-04",
      checkOut: "2026-05-01",
      guestsCount: 2,
      nightlyRate: 150,
      cleaningFee: 45,
      taxesAmount: 0,
      securityDeposit: 200,
    });

    expect(parsed.success).toBe(false);
  });
});

describe("task validators", () => {
  it("accepts operational task priority values used by the database", () => {
    const parsed = taskSchema.safeParse({
      propertyId: uuid,
      title: "Preparar check-in autonomo",
      type: "cleaning",
      priority: "high",
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

describe("ai foundation validators", () => {
  it("accepts operational tracking events without raw personal data", () => {
    const parsed = operationalEventSchema.safeParse({
      eventName: "reservation.confirmed",
      entityType: "reservation",
      entityId: uuid,
      reservationId: uuid,
      source: "web",
      metadata: { channel: "direct" },
    });

    expect(parsed.success).toBe(true);
  });

  it("requires message labels to include at least one useful signal", () => {
    const parsed = messageLabelSchema.safeParse({
      conversationId: uuid,
      source: "human",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts explainable model prediction payloads", () => {
    const parsed = modelPredictionSchema.safeParse({
      task: "message_priority",
      modelName: "baseline-rules",
      modelVersion: "0.1.0",
      entityType: "conversation",
      entityId: uuid,
      inputHash: "conversation-123456",
      output: { priority: "high" },
      explanation: { reason: "Check-in cercano y mensaje sin responder." },
      confidence: 0.82,
    });

    expect(parsed.success).toBe(true);
  });

  it("captures ai audit entries with privacy flags", () => {
    const parsed = aiAuditLogSchema.safeParse({
      action: "message_summary.generated",
      provider: "internal",
      modelName: "baseline-summary",
      promptHash: "prompt-abcdef123",
      containsPersonalData: true,
      riskLevel: "medium",
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts visual audit memories for regression tracking", () => {
    const parsed = qualityAuditMemorySchema.safeParse({
      area: "visual",
      route: "/dashboard",
      findingHash: "dashboard-cards-alignment-001",
      title: "Dashboard cards alignment",
      description: "Keep dashboard cards aligned across desktop and laptop layouts.",
      severity: "medium",
    });

    expect(parsed.success).toBe(true);
  });
});
