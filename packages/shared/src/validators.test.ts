import { describe, expect, it } from "vitest";

import {
  aiAuditLogSchema,
  automationRuleSchema,
  calendarBlockSchema,
  channelAccountSchema,
  channelSyncEventSchema,
  checkoutConfirmationSchema,
  directBookingInquirySchema,
  documentSchema,
  documentUploadUrlSchema,
  guestWorkflowSchema,
  incidentSchema,
  listingSchema,
  loginSchema,
  manualReservationSchema,
  messageLabelSchema,
  modelPredictionSchema,
  notificationSchema,
  operationalEventSchema,
  ownerStatementSchema,
  paymentSchema,
  propertySchema,
  qualityAuditMemorySchema,
  registerSchema,
  reservationSchema,
  taskSchema,
} from "./validators";

const uuid = "11111111-1111-4111-8111-111111111111";
const seededUuid = "40000000-0000-0000-0000-000000000001";

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

describe("calendar validators", () => {
  it("accepts manual calendar blocks with a valid date range", () => {
    const parsed = calendarBlockSchema.safeParse({
      endDate: "2026-05-08",
      propertyId: uuid,
      reason: "Mantenimiento preventivo",
      startDate: "2026-05-07",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects calendar blocks whose end date is before the start date", () => {
    const parsed = calendarBlockSchema.safeParse({
      endDate: "2026-05-06",
      propertyId: uuid,
      reason: "Mantenimiento preventivo",
      startDate: "2026-05-07",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("automation validators", () => {
  it("accepts a message automation rule", () => {
    const parsed = automationRuleSchema.safeParse({
      channel: "email",
      delayMinutes: "60",
      enabled: true,
      name: "Enviar instrucciones de llegada",
      template: "Hola {{guest_name}}, aqui tienes las instrucciones.",
      trigger: "checkin_24h",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects automation templates that are too short", () => {
    const parsed = automationRuleSchema.safeParse({
      channel: "email",
      delayMinutes: 0,
      enabled: true,
      name: "Aviso",
      template: "Hola",
      trigger: "reservation_confirmed",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("workflow validators", () => {
  it("accepts guest lifecycle workflow templates", () => {
    const parsed = guestWorkflowSchema.safeParse({
      channel: "whatsapp",
      delayMinutes: "0",
      enabled: true,
      name: "Enviar instrucciones 24h antes",
      template:
        "Hola {{guest_name}}, manana es tu llegada a {{property_name}}.",
      trigger: "checkin_24h",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects non guest lifecycle automation triggers", () => {
    const parsed = guestWorkflowSchema.safeParse({
      channel: "inbox",
      delayMinutes: 0,
      enabled: true,
      name: "Responder mensaje sin SLA",
      template:
        "Hola {{guest_name}}, estamos revisando tu mensaje con prioridad.",
      trigger: "message_unanswered",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("distribution validators", () => {
  it("accepts channel listing inputs", () => {
    const parsed = listingSchema.safeParse({
      channel: "airbnb",
      channelUrl: "https://airbnb.example/listing/e2e",
      externalListingId: "airbnb-e2e",
      propertyId: seededUuid,
      publicSlug: "atico-gran-via",
      status: "published",
      syncEnabled: "true",
      syncNotes: "Sync activo para disponibilidad y mensajes.",
      title: "Atico Gran Via Sky",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.syncEnabled).toBe(true);
    }
  });

  it("parses sync event JSON payloads", () => {
    const parsed = channelSyncEventSchema.safeParse({
      channel: "booking",
      direction: "outbound",
      listingId: seededUuid,
      payload: '{"action":"publish","source":"e2e"}',
      status: "synced",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.payload).toEqual({
        action: "publish",
        source: "e2e",
      });
    }
  });

  it("rejects sync events without listing or property context", () => {
    const parsed = channelSyncEventSchema.safeParse({
      channel: "direct",
      direction: "inbound",
      payload: "{}",
      status: "pending",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts channel account readiness inputs and parses scopes", () => {
    const parsed = channelAccountSchema.safeParse({
      accountLabel: "Airbnb WIA Demo",
      authMode: "partner_api",
      channel: "airbnb",
      externalAccountId: "airbnb-host-demo",
      healthStatus: "synced",
      notes: "Cuenta preparada para disponibilidad, reservas y mensajes.",
      scopes: "availability,reservations,messages",
      status: "connected",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.scopes).toEqual([
        "availability",
        "reservations",
        "messages",
      ]);
    }
  });
});

describe("direct booking validators", () => {
  it("accepts direct booking inquiries with consent", () => {
    const parsed = directBookingInquirySchema.safeParse({
      checkIn: "2026-05-10",
      checkOut: "2026-05-13",
      consent: "true",
      guestEmail: "sofia@example.com",
      guestFullName: "Sofia Martin",
      guestPhone: "+34611111111",
      guestsCount: "2",
      message: "Nos gustaria confirmar disponibilidad.",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects direct booking inquiries without consent", () => {
    const parsed = directBookingInquirySchema.safeParse({
      checkIn: "2026-05-10",
      checkOut: "2026-05-13",
      consent: false,
      guestEmail: "sofia@example.com",
      guestFullName: "Sofia Martin",
      guestsCount: 2,
    });

    expect(parsed.success).toBe(false);
  });
});

describe("payment validators", () => {
  it("accepts manual payment records", () => {
    const parsed = paymentSchema.safeParse({
      amount: "645",
      currency: "EUR",
      paidAt: "2026-05-01T10:30",
      provider: "manual",
      reservationId: uuid,
      status: "paid",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects negative payment amounts", () => {
    const parsed = paymentSchema.safeParse({
      amount: -1,
      currency: "EUR",
      provider: "manual",
      reservationId: uuid,
      status: "paid",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("checkout validators", () => {
  it("accepts signed checkout confirmation tokens", () => {
    const parsed = checkoutConfirmationSchema.safeParse({
      token: "checkout-token-11111111-2222-4333-8444-555555555555",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects short checkout tokens", () => {
    const parsed = checkoutConfirmationSchema.safeParse({
      token: "short",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("notification validators", () => {
  it("accepts short operational notifications", () => {
    const parsed = notificationSchema.safeParse({
      body: "Hay un mensaje pendiente de respuesta.",
      title: "Nuevo mensaje urgente",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty notification titles", () => {
    const parsed = notificationSchema.safeParse({
      title: "",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("owner statement validators", () => {
  it("accepts owner statement financial inputs from forms", () => {
    const parsed = ownerStatementSchema.safeParse({
      cleaningCosts: "80",
      grossRevenue: "1200",
      maintenanceCosts: "45",
      netPayout: "970",
      ownerAccountId: "10000000-0000-0000-0000-000000000001",
      periodEnd: "2026-04-30",
      periodStart: "2026-04-01",
      platformFees: "105",
      propertyId: "",
      status: "pending",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.propertyId).toBeUndefined();
      expect(parsed.data.netPayout).toBe(970);
    }
  });

  it("rejects owner statements with inverted periods", () => {
    const parsed = ownerStatementSchema.safeParse({
      ownerAccountId: "10000000-0000-0000-0000-000000000001",
      periodEnd: "2026-04-01",
      periodStart: "2026-04-30",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("document validators", () => {
  it("accepts document evidence linked to an operation context", () => {
    const parsed = documentSchema.safeParse({
      mimeType: "application/pdf",
      propertyId: uuid,
      reservationId: "",
      storagePath: "reservation-documents/res-1028/checkin.pdf",
      title: "Evidencia de check-in",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.reservationId).toBeUndefined();
    }
  });

  it("rejects document evidence without a useful storage path", () => {
    const parsed = documentSchema.safeParse({
      storagePath: "",
      title: "ID",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects unsafe document storage paths", () => {
    const parsed = documentUploadUrlSchema.safeParse({
      storagePath: "../secret.pdf",
      upsert: "false",
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

  it("accepts Supabase seed UUIDs used by deterministic local data", () => {
    const parsed = operationalEventSchema.safeParse({
      entityId: seededUuid,
      entityType: "reservation",
      eventName: "reservation.updated",
      propertyId: "20000000-0000-0000-0000-000000000001",
      reservationId: seededUuid,
      source: "e2e",
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
      description:
        "Keep dashboard cards aligned across desktop and laptop layouts.",
      severity: "medium",
    });

    expect(parsed.success).toBe(true);
  });
});
