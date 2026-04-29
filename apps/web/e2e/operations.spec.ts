import { expect, test } from "@playwright/test";

import {
  isoDateFromToday,
  seedIds,
  signInAsDemoOperator,
  uniqueName,
} from "./helpers";

test.describe("operations flows with Supabase @critical @data", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsDemoOperator(page);
  });

  test("creates a reservation through the UI and exposes it through the API", async ({
    page,
  }) => {
    const guestName = uniqueName("E2E Reserva");

    await page.goto("/reservations");
    await page.locator("#guestFullName").fill(guestName);
    await page
      .locator("#guestEmail")
      .fill(`${guestName.toLowerCase().replaceAll(" ", ".")}@example.com`);
    await page.locator("#checkIn").fill(isoDateFromToday(30));
    await page.locator("#checkOut").fill(isoDateFromToday(33));
    await page.locator("#guestsCount").fill("3");
    await page.locator("#nightlyRate").fill("155");
    await page.locator("#cleaningFee").fill("45");
    await page.locator("#taxesAmount").fill("12");
    await page.locator("#securityDeposit").fill("150");
    await page
      .locator('textarea[name="notes"]')
      .fill("Reserva creada por Playwright para validar el flujo real.");
    await page.getByRole("button", { name: /crear reserva/i }).click();

    await expect(page).toHaveURL(/\/reservations\/[a-f0-9-]+(\?created=1)?$/);
    await expect(page.getByText("Reserva creada correctamente.")).toBeVisible();
    await expect(page.getByText(guestName)).toBeVisible();

    const reservationId = page.url().match(/\/reservations\/([a-f0-9-]+)/)?.[1];
    expect(reservationId).toBeTruthy();

    const updatedGuestName = `${guestName} editada`;
    const reservationUpdateResponse = await page.request.patch(
      `/api/reservations/${reservationId}`,
      {
        data: {
          channel: "direct",
          checkIn: isoDateFromToday(31),
          checkOut: isoDateFromToday(34),
          cleaningFee: 50,
          guestEmail: `${updatedGuestName.toLowerCase().replaceAll(" ", ".")}@example.com`,
          guestFullName: updatedGuestName,
          guestPhone: "+34999999999",
          guestsCount: 2,
          nightlyRate: 165,
          notes:
            "Reserva actualizada por Playwright para validar edicion completa.",
          propertyId: seedIds.propertyId,
          securityDeposit: 180,
          status: "confirmed",
          taxesAmount: 14,
        },
      },
    );
    expect(reservationUpdateResponse.status()).toBe(200);

    await page.goto(`/reservations/${reservationId}`);
    await expect(page.getByText(updatedGuestName)).toBeVisible();
    await expect(
      page.getByText("Reserva actualizada correctamente."),
    ).not.toBeVisible();

    const response = await page.request.get("/api/reservations");
    expect(response.status()).toBe(200);

    const body = (await response.json()) as {
      data: Array<{ guest: string }>;
    };
    expect(
      body.data.some((reservation) => reservation.guest === updatedGuestName),
    ).toBe(true);

    await page.goto(`/reservations?q=${encodeURIComponent(updatedGuestName)}`);
    await expect(page.getByText(`Mostrando 1 de`)).toBeVisible();
    await expect(page.getByText(updatedGuestName)).toBeVisible();
  });

  test("creates and updates task, incident and inbox records through authenticated API routes", async ({
    page,
  }) => {
    const taskTitle = uniqueName("E2E Tarea");
    const taskResponse = await page.request.post("/api/tasks", {
      data: {
        description: "Validacion automatica de tarea operativa.",
        dueAt: `${isoDateFromToday(10)}T10:30`,
        priority: "high",
        propertyId: seedIds.propertyId,
        reservationId: seedIds.reservationId,
        status: "open",
        title: taskTitle,
        type: "maintenance",
      },
    });
    expect(taskResponse.status()).toBe(201);

    const taskBody = (await taskResponse.json()) as { data: { id: string } };
    const updatedTaskTitle = `${taskTitle} editada`;
    const taskPatchResponse = await page.request.patch(
      `/api/tasks/${taskBody.data.id}`,
      {
        data: {
          description: "Tarea actualizada por Playwright antes de cerrar.",
          dueAt: `${isoDateFromToday(11)}T12:00`,
          priority: "critical",
          propertyId: seedIds.propertyId,
          reservationId: seedIds.reservationId,
          status: "in_progress",
          title: updatedTaskTitle,
          type: "inspection",
        },
      },
    );
    expect(taskPatchResponse.status()).toBe(200);

    const taskUpdateResponse = await page.request.patch(
      `/api/tasks/${taskBody.data.id}/status`,
      { data: { status: "done" } },
    );
    expect(taskUpdateResponse.status()).toBe(200);

    await page.goto(`/tasks/${taskBody.data.id}`);
    await expect(page.getByText(updatedTaskTitle)).toBeVisible();

    await page.goto(
      `/tasks?q=${encodeURIComponent(updatedTaskTitle)}&status=Cerrada`,
    );
    await expect(page.getByText(`Mostrando 1 de`)).toBeVisible();
    await expect(page.getByText(updatedTaskTitle)).toBeVisible();

    const incidentTitle = uniqueName("E2E Incidencia");
    const incidentResponse = await page.request.post("/api/incidents", {
      data: {
        description:
          "Incidencia creada por Playwright para proteger el flujo de operaciones.",
        estimatedCost: 125,
        propertyId: seedIds.propertyId,
        reservationId: seedIds.reservationId,
        severity: "high",
        status: "open",
        title: incidentTitle,
      },
    });
    expect(incidentResponse.status()).toBe(201);

    const incidentBody = (await incidentResponse.json()) as {
      data: { id: string };
    };
    const updatedIncidentTitle = `${incidentTitle} editada`;
    const incidentPatchResponse = await page.request.patch(
      `/api/incidents/${incidentBody.data.id}`,
      {
        data: {
          description:
            "Incidencia actualizada por Playwright con coste, severidad y estado.",
          estimatedCost: 140,
          propertyId: seedIds.propertyId,
          reservationId: seedIds.reservationId,
          severity: "critical",
          status: "investigating",
          title: updatedIncidentTitle,
        },
      },
    );
    expect(incidentPatchResponse.status()).toBe(200);

    const incidentUpdateResponse = await page.request.patch(
      `/api/incidents/${incidentBody.data.id}/status`,
      { data: { status: "charged" } },
    );
    expect(incidentUpdateResponse.status()).toBe(200);

    await page.goto(`/incidents/${incidentBody.data.id}`);
    await expect(page.getByText(updatedIncidentTitle)).toBeVisible();

    await page.goto(
      `/incidents?q=${encodeURIComponent(updatedIncidentTitle)}&status=Cargada`,
    );
    await expect(page.getByText(`Mostrando 1 de`)).toBeVisible();
    await expect(page.getByText(updatedIncidentTitle)).toBeVisible();

    const replyBody = uniqueName("Respuesta E2E inbox");
    const messageResponse = await page.request.post(
      `/api/inbox/${seedIds.conversationId}/messages`,
      {
        data: {
          body: replyBody,
          channel: "inbox",
        },
      },
    );
    expect(messageResponse.status()).toBe(201);

    await page.goto(`/inbox/${seedIds.conversationId}`);
    await expect(page.getByText(replyBody)).toBeVisible();

    await page.goto(`/inbox?q=${encodeURIComponent(replyBody)}`);
    await expect(page.getByText(`Mostrando 1 de`)).toBeVisible();
    await expect(page.getByText(replyBody)).toBeVisible();
  });

  test("normalizes inbound channel messages into the unified inbox", async ({
    page,
  }) => {
    const guestName = uniqueName("E2E Canal");
    const inboundResponse = await page.request.post("/api/channels/messages", {
      data: {
        body: "Mensaje entrante creado por Playwright desde Airbnb.",
        channel: "airbnb",
        externalMessageId: `airbnb-${Date.now()}`,
        guestEmail: `${guestName.toLowerCase().replaceAll(" ", ".")}@example.com`,
        guestFullName: guestName,
        guestPhone: "+34622222222",
        propertyId: seedIds.propertyId,
      },
    });
    expect(inboundResponse.status()).toBe(201);

    const inboundBody = (await inboundResponse.json()) as {
      data: { conversationId: string; messageId: string };
    };
    expect(inboundBody.data.conversationId).toBeTruthy();
    expect(inboundBody.data.messageId).toBeTruthy();

    await page.goto(`/inbox?q=${encodeURIComponent(guestName)}`);
    await expect(page.getByText(guestName).first()).toBeVisible();
    await expect(page.getByText("Airbnb").first()).toBeVisible();
    await expect(
      page.getByText("Mensaje entrante creado por Playwright desde Airbnb."),
    ).toBeVisible();
  });

  test("updates and archives a property through authenticated API routes", async ({
    page,
  }) => {
    await signInAsDemoOperator(page);

    const propertyName = uniqueName("E2E Propiedad");
    const updatedName = `${propertyName} editada`;
    const propertyResponse = await page.request.post("/api/properties", {
      data: {
        addressLine: "Calle E2E 12",
        basePrice: 180,
        bathrooms: 1,
        bedrooms: 2,
        city: "Madrid",
        cleaningFee: 55,
        country: "Spain",
        description: "Propiedad creada por Playwright para validar CRUD.",
        internalName: uniqueName("E2E-PROP"),
        maxGuests: 4,
        name: propertyName,
        province: "Madrid",
        status: "active",
      },
    });

    expect(propertyResponse.ok()).toBe(true);
    const propertyBody = (await propertyResponse.json()) as {
      data: { id: string };
    };

    const updateResponse = await page.request.patch(
      `/api/properties/${propertyBody.data.id}`,
      {
        data: {
          addressLine: "Calle E2E 14",
          basePrice: 195,
          bathrooms: 1.5,
          bedrooms: 2,
          city: "Madrid",
          cleaningFee: 60,
          country: "Spain",
          description: "Propiedad actualizada por Playwright.",
          internalName: uniqueName("E2E-PROP-EDIT"),
          maxGuests: 4,
          name: updatedName,
          province: "Madrid",
          status: "paused",
        },
      },
    );

    expect(updateResponse.ok()).toBe(true);

    await page.goto(`/properties/${propertyBody.data.id}`);
    await expect(
      page.getByRole("heading", { name: updatedName }),
    ).toBeVisible();
    await expect(page.getByText("Pausado")).toBeVisible();

    const archiveResponse = await page.request.delete(
      `/api/properties/${propertyBody.data.id}`,
    );
    expect(archiveResponse.ok()).toBe(true);

    await page.goto(`/properties/${propertyBody.data.id}`);
    await expect(page.getByText("Archivado")).toBeVisible();
  });

  test("loads owner portal data and updates the current profile settings", async ({
    page,
  }) => {
    await page.goto("/owners");
    await expect(
      page.getByRole("heading", { name: /liquidaciones/i }),
    ).toBeVisible();
    await expect(page.getByText("Carlos Propietario")).toBeVisible();
    await expect(
      page.locator("p").filter({ hasText: "Atico Gran Via Sky" }).first(),
    ).toBeVisible();

    await page.goto("/settings");
    await expect(page.locator("#email")).toHaveValue(
      "operaciones@wiahost.local",
    );

    const phone = `+34${Date.now().toString().slice(-9)}`;
    await page.locator("#phone").fill(phone);
    await page.getByRole("button", { name: /guardar perfil/i }).click();

    await expect(page).toHaveURL(/\/settings\?updated=1$/);
    await expect(
      page.getByText("Perfil actualizado correctamente."),
    ).toBeVisible();
    await expect(page.locator("#phone")).toHaveValue(phone);
  });

  test("creates a guest and calendar block through API routes", async ({
    page,
  }) => {
    const guestName = uniqueName("E2E Huesped");
    const guestResponse = await page.request.post("/api/guests", {
      data: {
        email: `${guestName.toLowerCase().replaceAll(" ", ".")}@example.com`,
        fullName: guestName,
        notes: "Creado por Playwright para validar CRM de huespedes.",
        phone: "+34611111111",
        preferredLanguage: "es",
      },
    });
    expect(guestResponse.status()).toBe(201);

    const guestBody = (await guestResponse.json()) as { data: { id: string } };
    const updatedGuestName = `${guestName} editado`;
    const guestPatchResponse = await page.request.patch(
      `/api/guests/${guestBody.data.id}`,
      {
        data: {
          email: `${updatedGuestName.toLowerCase().replaceAll(" ", ".")}@example.com`,
          fullName: updatedGuestName,
          notes: "Actualizado por Playwright para validar ficha de huesped.",
          phone: "+34622222222",
          preferredLanguage: "en",
        },
      },
    );
    expect(guestPatchResponse.status()).toBe(200);

    await page.goto(`/guests/${guestBody.data.id}`);
    await expect(
      page.getByRole("heading", { name: updatedGuestName }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Actualizado por Playwright para validar ficha de huesped.",
      ),
    ).toBeVisible();

    await page.goto(`/guests/${guestBody.data.id}/edit`);
    await expect(page.locator("#fullName")).toHaveValue(updatedGuestName);
    await expect(page.locator("#preferredLanguage")).toHaveValue("en");

    await page.goto(`/guests?q=${encodeURIComponent(updatedGuestName)}`);
    await expect(page.getByText(`Mostrando 1 de`)).toBeVisible();
    await expect(page.getByText(updatedGuestName)).toBeVisible();

    const blockReason = uniqueName("Bloqueo E2E");
    const blockResponse = await page.request.post("/api/calendar-blocks", {
      data: {
        endDate: isoDateFromToday(7),
        propertyId: seedIds.propertyId,
        reason: blockReason,
        source: "manual",
        startDate: isoDateFromToday(6),
      },
    });
    expect(blockResponse.status()).toBe(201);
    const blockBody = (await blockResponse.json()) as { data: { id: string } };

    const updatedBlockReason = `${blockReason} editado`;
    const blockPatchResponse = await page.request.patch(
      `/api/calendar-blocks/${blockBody.data.id}`,
      {
        data: {
          endDate: isoDateFromToday(7),
          propertyId: seedIds.propertyId,
          reason: updatedBlockReason,
          source: "manual",
          startDate: isoDateFromToday(6),
        },
      },
    );
    expect(blockPatchResponse.status()).toBe(200);

    const blockDetailResponse = await page.request.get(
      `/api/calendar-blocks/${blockBody.data.id}`,
    );
    expect(blockDetailResponse.status()).toBe(200);

    await page.goto("/calendar");
    await expect(
      page.getByRole("heading", { name: /disponibilidad/i }),
    ).toBeVisible();
    await expect(
      page.locator("p").filter({ hasText: "Atico Gran Via Sky" }).first(),
    ).toBeVisible();
    await expect(
      page.getByText(`Bloqueo - ${updatedBlockReason}`),
    ).toBeVisible();

    const blockDeleteResponse = await page.request.delete(
      `/api/calendar-blocks/${blockBody.data.id}`,
    );
    expect(blockDeleteResponse.status()).toBe(200);

    await page.goto("/calendar");
    await expect(page.getByText(updatedBlockReason)).not.toBeVisible();
  });

  test("creates, updates and deletes automation rules through API routes", async ({
    page,
  }) => {
    const existingRulesResponse = await page.request.get("/api/automations");
    if (existingRulesResponse.ok()) {
      const existingRules = (await existingRulesResponse.json()) as {
        data: Array<{ id: string; name: string }>;
      };

      for (const rule of existingRules.data.filter((item) =>
        item.name.startsWith("E2E Automatizacion"),
      )) {
        await page.request.delete(`/api/automations/${rule.id}`);
      }
    }

    const ruleName = uniqueName("E2E Automatizacion");
    const ruleResponse = await page.request.post("/api/automations", {
      data: {
        channel: "email",
        delayMinutes: 30,
        enabled: true,
        name: ruleName,
        template:
          "Hola {{guest_name}}, aqui tienes una automatizacion validada por E2E.",
        trigger: "checkin_24h",
      },
    });
    expect(ruleResponse.status()).toBe(201);

    const ruleBody = (await ruleResponse.json()) as { data: { id: string } };
    const updatedRuleName = `${ruleName} editada`;
    const rulePatchResponse = await page.request.patch(
      `/api/automations/${ruleBody.data.id}`,
      {
        data: {
          channel: "inbox",
          delayMinutes: 0,
          enabled: false,
          name: updatedRuleName,
          template:
            "Mensaje interno actualizado por Playwright para validar automatizaciones.",
          trigger: "message_unanswered",
        },
      },
    );
    expect(rulePatchResponse.status()).toBe(200);

    await page.goto("/automations");
    await expect(
      page.getByRole("heading", { name: /reglas operativas/i }),
    ).toBeVisible();
    await expect(page.getByText(updatedRuleName)).toBeVisible();
    await expect(
      page.getByText("Pausada", { exact: true }).first(),
    ).toBeVisible();

    const ruleDeleteResponse = await page.request.delete(
      `/api/automations/${ruleBody.data.id}`,
    );
    expect(ruleDeleteResponse.status()).toBe(200);

    await page.goto("/automations");
    await expect(page.getByText(updatedRuleName)).not.toBeVisible();
  });

  test("creates, updates and deletes guest workflows through API routes", async ({
    page,
  }) => {
    const existingWorkflowsResponse = await page.request.get("/api/workflows");
    if (existingWorkflowsResponse.ok()) {
      const existingWorkflows = (await existingWorkflowsResponse.json()) as {
        data: Array<{ id: string; name: string }>;
      };

      for (const workflow of existingWorkflows.data.filter((item) =>
        item.name.startsWith("E2E Workflow"),
      )) {
        await page.request.delete(`/api/workflows/${workflow.id}`);
      }
    }

    const workflowName = uniqueName("E2E Workflow");
    const workflowResponse = await page.request.post("/api/workflows", {
      data: {
        channel: "whatsapp",
        delayMinutes: 0,
        enabled: true,
        name: workflowName,
        template:
          "Hola {{guest_name}}, aqui tienes las instrucciones para {{property_name}}.",
        trigger: "checkin_24h",
      },
    });
    expect(workflowResponse.status()).toBe(201);

    const workflowBody = (await workflowResponse.json()) as {
      data: { id: string };
    };
    const updatedWorkflowName = `${workflowName} editado`;
    const workflowPatchResponse = await page.request.patch(
      `/api/workflows/${workflowBody.data.id}`,
      {
        data: {
          channel: "inbox",
          delayMinutes: 15,
          enabled: false,
          name: updatedWorkflowName,
          template:
            "Mensaje actualizado para {{guest_name}} con soporte en {{support_phone}}.",
          trigger: "checkout_time",
        },
      },
    );
    expect(workflowPatchResponse.status()).toBe(200);

    await page.goto("/workflows");
    await expect(
      page.getByRole("heading", { name: /check-in y check-out/i }),
    ).toBeVisible();
    await expect(page.getByText(updatedWorkflowName)).toBeVisible();
    await expect(
      page.locator("span").filter({ hasText: "Pausada" }).first(),
    ).toBeVisible();

    const workflowDeleteResponse = await page.request.delete(
      `/api/workflows/${workflowBody.data.id}`,
    );
    expect(workflowDeleteResponse.status()).toBe(200);

    await page.goto("/workflows");
    await expect(page.getByText(updatedWorkflowName)).not.toBeVisible();
  });

  test("creates, updates and deletes distribution listings through API routes", async ({
    page,
  }) => {
    const existingListingsResponse = await page.request.get(
      "/api/distribution/listings",
    );
    if (existingListingsResponse.ok()) {
      const existingListings = (await existingListingsResponse.json()) as {
        data: Array<{ id: string; title: string }>;
      };

      for (const listing of existingListings.data.filter((item) =>
        item.title.startsWith("E2E Listing"),
      )) {
        await page.request.delete(`/api/distribution/listings/${listing.id}`);
      }
    }

    const listingTitle = uniqueName("E2E Listing");
    const externalListingId = `e2e-${Date.now()}`;
    const listingResponse = await page.request.post(
      "/api/distribution/listings",
      {
        data: {
          channel: "airbnb",
          channelUrl: "https://airbnb.example/listing/e2e",
          externalListingId,
          propertyId: seedIds.propertyId,
          publicSlug: externalListingId,
          status: "published",
          syncEnabled: true,
          syncNotes: "Creado por Playwright para validar distribucion.",
          title: listingTitle,
        },
      },
    );
    expect(listingResponse.status()).toBe(201);

    const listingBody = (await listingResponse.json()) as {
      data: { id: string };
    };
    const updatedListingTitle = `${listingTitle} editada`;
    const listingPatchResponse = await page.request.patch(
      `/api/distribution/listings/${listingBody.data.id}`,
      {
        data: {
          channel: "booking",
          channelUrl: "https://booking.example/hotel/e2e",
          externalListingId,
          propertyId: seedIds.propertyId,
          publicSlug: `${externalListingId}-edit`,
          status: "paused",
          syncEnabled: false,
          syncNotes: "Actualizado por Playwright antes de registrar sync.",
          title: updatedListingTitle,
        },
      },
    );
    expect(listingPatchResponse.status()).toBe(200);

    const syncResponse = await page.request.post(
      "/api/distribution/sync-events",
      {
        data: {
          channel: "booking",
          direction: "outbound",
          listingId: listingBody.data.id,
          payload: { action: "availability_update", source: "playwright" },
          status: "synced",
        },
      },
    );
    expect(syncResponse.status()).toBe(201);

    await page.goto("/distribution");
    await expect(
      page.getByRole("heading", { name: /canales y sincronizacion/i }),
    ).toBeVisible();
    await expect(
      page
        .locator('[data-slot="card-title"]')
        .filter({ hasText: updatedListingTitle })
        .first(),
    ).toBeVisible();
    await expect(
      page.locator("span").filter({ hasText: "Pausado" }).first(),
    ).toBeVisible();
    await expect(page.getByText("availability_update")).toBeVisible();

    const listingDeleteResponse = await page.request.delete(
      `/api/distribution/listings/${listingBody.data.id}`,
    );
    expect(listingDeleteResponse.status()).toBe(200);

    await page.goto("/distribution");
    await expect(page.getByText(updatedListingTitle)).not.toBeVisible();
  });

  test("imports iCal availability blocks through API routes", async ({
    page,
  }) => {
    const sourceName = uniqueName("E2E iCal");
    const startDate = isoDateFromToday(120).replaceAll("-", "");
    const endDate = isoDateFromToday(123).replaceAll("-", "");
    const icalResponse = await page.request.post("/api/ical/import", {
      data: {
        channel: "airbnb",
        icalText: [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "BEGIN:VEVENT",
          `DTSTART;VALUE=DATE:${startDate}`,
          `DTEND;VALUE=DATE:${endDate}`,
          "SUMMARY:Busy from Airbnb",
          "END:VEVENT",
          "END:VCALENDAR",
        ].join("\r\n"),
        propertyId: seedIds.propertyId,
        sourceName,
      },
    });
    expect(icalResponse.status()).toBe(201);

    const icalBody = (await icalResponse.json()) as {
      data: { imported: number; parsed: number };
    };
    expect(icalBody.data.parsed).toBe(1);
    expect(icalBody.data.imported).toBeGreaterThanOrEqual(1);

    await page.goto("/distribution");
    await expect(page.getByText("ical_import").first()).toBeVisible();
  });

  test("converts direct booking leads through the commercial pipeline", async ({
    page,
  }) => {
    const guestName = uniqueName("E2E Lead Directo");
    const inquiryResponse = await page.request.post(
      "/api/book/loft-malaga-centro/inquiries",
      {
        data: {
          checkIn: isoDateFromToday(60),
          checkOut: isoDateFromToday(63),
          consent: true,
          guestEmail: `${guestName.toLowerCase().replaceAll(" ", ".")}@example.com`,
          guestFullName: guestName,
          guestPhone: "+34611111111",
          guestsCount: 2,
          message:
            "Lead directo creado por Playwright para validar conversion comercial.",
        },
      },
    );
    expect(inquiryResponse.status()).toBe(201);

    const inquiryBody = (await inquiryResponse.json()) as {
      data: { reservationId: string };
    };

    const leadsResponse = await page.request.get("/api/leads");
    expect(leadsResponse.status()).toBe(200);
    const leadsBody = (await leadsResponse.json()) as {
      data: Array<{ guest: string; id: string; status: string }>;
    };
    expect(
      leadsBody.data.some(
        (lead) => lead.guest === guestName && lead.status === "Consulta",
      ),
    ).toBe(true);

    await page.goto("/leads");
    await expect(
      page.getByRole("heading", { name: /solicitudes web/i }),
    ).toBeVisible();
    await expect(
      page
        .locator('[data-slot="card-title"]')
        .filter({ hasText: guestName })
        .first(),
    ).toBeVisible();

    const paymentRequestResponse = await page.request.post(
      `/api/leads/${inquiryBody.data.reservationId}/payment-request`,
    );
    expect(paymentRequestResponse.status()).toBe(201);

    const paymentRequestBody = (await paymentRequestResponse.json()) as {
      data: { paymentId: string; status: string };
    };
    expect(paymentRequestBody.data.paymentId).toBeTruthy();
    expect(paymentRequestBody.data.status).toBe("pending");

    await page.goto("/leads");
    await expect(
      page
        .locator('[data-slot="card-title"]')
        .filter({ hasText: guestName })
        .first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /pago preparado/i }).first(),
    ).toBeVisible();

    const leadPatchResponse = await page.request.patch(
      `/api/leads/${inquiryBody.data.reservationId}/status`,
      { data: { status: "confirmed" } },
    );
    expect(leadPatchResponse.status()).toBe(200);

    await page.goto("/leads");
    await expect(
      page
        .locator('[data-slot="card-title"]')
        .filter({ hasText: guestName })
        .first(),
    ).toBeVisible();
    await expect(
      page.locator("span").filter({ hasText: "Confirmada" }).first(),
    ).toBeVisible();
  });

  test("creates, updates and deletes payments through API routes", async ({
    page,
  }) => {
    const existingPaymentsResponse = await page.request.get("/api/payments");
    if (existingPaymentsResponse.ok()) {
      const existingPayments = (await existingPaymentsResponse.json()) as {
        data: Array<{ id: string; raw?: { provider?: string } }>;
      };

      for (const payment of existingPayments.data.filter((item) =>
        item.raw?.provider?.startsWith("e2e-manual"),
      )) {
        await page.request.delete(`/api/payments/${payment.id}`);
      }
    }

    const amount = 700 + (Date.now() % 100);
    const paymentResponse = await page.request.post("/api/payments", {
      data: {
        amount,
        currency: "EUR",
        paidAt: `${isoDateFromToday(0)}T10:30`,
        provider: "e2e-manual",
        reservationId: seedIds.reservationId,
        status: "authorized",
      },
    });
    expect(paymentResponse.status()).toBe(201);

    const paymentBody = (await paymentResponse.json()) as {
      data: { id: string };
    };
    const updatedAmount = amount + 1;
    const paymentPatchResponse = await page.request.patch(
      `/api/payments/${paymentBody.data.id}`,
      {
        data: {
          amount: updatedAmount,
          currency: "EUR",
          paidAt: `${isoDateFromToday(0)}T11:00`,
          provider: "e2e-manual-updated",
          reservationId: seedIds.reservationId,
          status: "paid",
        },
      },
    );
    expect(paymentPatchResponse.status()).toBe(200);

    await page.goto("/payments");
    await expect(
      page.getByRole("heading", { name: /control financiero/i }),
    ).toBeVisible();
    await expect(page.getByText(`${updatedAmount} EUR`).first()).toBeVisible();
    await expect(
      page.locator("span").filter({ hasText: "Pagado" }).first(),
    ).toBeVisible();

    const paymentDeleteResponse = await page.request.delete(
      `/api/payments/${paymentBody.data.id}`,
    );
    expect(paymentDeleteResponse.status()).toBe(200);

    await page.goto("/payments");
    await expect(page.getByText(`${updatedAmount} EUR`)).not.toBeVisible();
  });

  test("creates, updates and deletes pricing observations through API routes", async ({
    page,
  }) => {
    const source = uniqueName("e2e-pricing");
    const pricingResponse = await page.request.post(
      "/api/pricing/observations",
      {
        data: {
          approvedPrice: 175,
          conversionStatus: "viewed",
          currency: "EUR",
          currentPrice: 150,
          finalPrice: 175,
          leadTimeDays: 21,
          observedFor: isoDateFromToday(90),
          occupancyRate: 0.72,
          propertyId: seedIds.propertyId,
          source,
          suggestedPrice: 180,
        },
      },
    );
    expect(pricingResponse.status()).toBe(201);

    const pricingBody = (await pricingResponse.json()) as {
      data: { id: string };
    };
    const updatedSource = `${source}-updated`;
    const pricingPatchResponse = await page.request.patch(
      `/api/pricing/observations/${pricingBody.data.id}`,
      {
        data: {
          approvedPrice: 190,
          bookingPace: 4,
          conversionStatus: "booked",
          currency: "EUR",
          currentPrice: 160,
          finalPrice: 190,
          leadTimeDays: 18,
          observedFor: isoDateFromToday(91),
          occupancyRate: 0.81,
          propertyId: seedIds.propertyId,
          reservationId: seedIds.reservationId,
          source: updatedSource,
          suggestedPrice: 195,
        },
      },
    );
    expect(pricingPatchResponse.status()).toBe(200);

    await page.goto("/pricing");
    await expect(
      page.getByRole("heading", { name: /control de precios/i }),
    ).toBeVisible();
    await expect(page.getByText(updatedSource).first()).toBeVisible();
    await expect(
      page.locator("span").filter({ hasText: "Reservado" }).first(),
    ).toBeVisible();

    const pricingSyncResponse = await page.request.post(
      `/api/pricing/observations/${pricingBody.data.id}/sync`,
    );
    expect(pricingSyncResponse.status()).toBe(201);

    const pricingSyncBody = (await pricingSyncResponse.json()) as {
      data: { id: string; status: string };
    };
    expect(pricingSyncBody.data.id).toBeTruthy();
    expect(pricingSyncBody.data.status).toBe("pending");

    await page.goto("/distribution");
    await expect(page.getByText("price_update").first()).toBeVisible();

    const pricingDeleteResponse = await page.request.delete(
      `/api/pricing/observations/${pricingBody.data.id}`,
    );
    expect(pricingDeleteResponse.status()).toBe(200);

    await page.goto("/pricing");
    await expect(page.getByText(updatedSource)).not.toBeVisible();
  });

  test("creates, updates and deletes document evidence through API routes", async ({
    page,
  }) => {
    const existingDocumentsResponse = await page.request.get("/api/documents");
    if (existingDocumentsResponse.ok()) {
      const existingDocuments = (await existingDocumentsResponse.json()) as {
        data: Array<{ id: string; raw?: { storagePath?: string } }>;
      };

      for (const document of existingDocuments.data.filter((item) =>
        item.raw?.storagePath?.startsWith("e2e/"),
      )) {
        await page.request.delete(`/api/documents/${document.id}`);
      }
    }

    const title = uniqueName("E2E Evidencia");
    const storagePath = `e2e/${Date.now()}-checkin.pdf`;
    const documentResponse = await page.request.post("/api/documents", {
      data: {
        mimeType: "application/pdf",
        propertyId: seedIds.propertyId,
        reservationId: seedIds.reservationId,
        storagePath,
        title,
      },
    });
    expect(documentResponse.status()).toBe(201);

    const documentBody = (await documentResponse.json()) as {
      data: { id: string };
    };
    const updatedTitle = `${title} editada`;
    const updatedStoragePath = storagePath.replace(
      "checkin.pdf",
      "checkin-editado.pdf",
    );
    const documentPatchResponse = await page.request.patch(
      `/api/documents/${documentBody.data.id}`,
      {
        data: {
          incidentId: seedIds.incidentId,
          mimeType: "application/pdf",
          propertyId: seedIds.propertyId,
          reservationId: seedIds.reservationId,
          storagePath: updatedStoragePath,
          title: updatedTitle,
        },
      },
    );
    expect(documentPatchResponse.status()).toBe(200);

    await page.goto("/documents");
    await expect(
      page.getByRole("heading", { name: /evidencias operativas/i }),
    ).toBeVisible();
    await expect(page.getByText(updatedTitle)).toBeVisible();
    await expect(page.getByText(updatedStoragePath)).toBeVisible();

    const documentDeleteResponse = await page.request.delete(
      `/api/documents/${documentBody.data.id}`,
    );
    expect(documentDeleteResponse.status()).toBe(200);

    await page.goto("/documents");
    await expect(page.getByText(updatedTitle)).not.toBeVisible();
  });

  test("creates and deletes audit events through API routes", async ({
    page,
  }) => {
    const existingEventsResponse = await page.request.get("/api/audit-events");
    if (existingEventsResponse.ok()) {
      const existingEvents = (await existingEventsResponse.json()) as {
        data: Array<{ id: string; title: string }>;
      };

      for (const event of existingEvents.data.filter((item) =>
        item.title.startsWith("e2e.audit."),
      )) {
        await page.request.delete(`/api/audit-events/${event.id}`);
      }
    }

    const eventName = `e2e.audit.${Date.now()}`;
    const note = uniqueName("Evento auditado por Playwright");
    const eventResponse = await page.request.post("/api/audit-events", {
      data: {
        entityId: seedIds.reservationId,
        entityType: "reservation",
        eventName,
        metadata: { note },
        propertyId: seedIds.propertyId,
        reservationId: seedIds.reservationId,
        source: "e2e-web",
      },
    });
    expect(eventResponse.status()).toBe(201);

    const eventBody = (await eventResponse.json()) as {
      data: { id: string };
    };

    await page.goto("/audit");
    await expect(
      page.getByRole("heading", { name: /auditoria operativa/i }),
    ).toBeVisible();
    await expect(page.getByText(eventName)).toBeVisible();
    await expect(page.getByText(`note: ${note}`)).toBeVisible();

    const eventDeleteResponse = await page.request.delete(
      `/api/audit-events/${eventBody.data.id}`,
    );
    expect(eventDeleteResponse.status()).toBe(200);

    await page.goto("/audit");
    await expect(page.getByText(eventName)).not.toBeVisible();
  });

  test("creates, updates and deletes owner statements through API routes", async ({
    page,
  }) => {
    const existingStatementsResponse = await page.request.get(
      "/api/owner-statements",
    );
    if (existingStatementsResponse.ok()) {
      const existingStatements = (await existingStatementsResponse.json()) as {
        data: Array<{ id: string; raw?: { grossRevenue?: number } }>;
      };

      for (const statement of existingStatements.data.filter(
        (item) => item.raw?.grossRevenue === 9876,
      )) {
        await page.request.delete(`/api/owner-statements/${statement.id}`);
      }
    }

    const statementResponse = await page.request.post("/api/owner-statements", {
      data: {
        cleaningCosts: 120,
        grossRevenue: 9876,
        maintenanceCosts: 80,
        netPayout: 9200,
        ownerAccountId: seedIds.ownerAccountId,
        periodEnd: isoDateFromToday(35),
        periodStart: isoDateFromToday(5),
        platformFees: 476,
        propertyId: seedIds.propertyId,
        status: "pending",
      },
    });
    expect(statementResponse.status()).toBe(201);

    const statementBody = (await statementResponse.json()) as {
      data: { id: string };
    };
    const statementPatchResponse = await page.request.patch(
      `/api/owner-statements/${statementBody.data.id}`,
      {
        data: {
          cleaningCosts: 120,
          grossRevenue: 9876,
          maintenanceCosts: 80,
          netPayout: 9300,
          ownerAccountId: seedIds.ownerAccountId,
          periodEnd: isoDateFromToday(35),
          periodStart: isoDateFromToday(5),
          platformFees: 376,
          propertyId: seedIds.propertyId,
          status: "synced",
        },
      },
    );
    expect(statementPatchResponse.status()).toBe(200);

    await page.goto("/statements");
    await expect(
      page.getByRole("heading", { name: /liquidaciones y payout/i }),
    ).toBeVisible();
    await expect(page.getByText("9300 EUR").first()).toBeVisible();
    await expect(
      page.locator("span").filter({ hasText: "Sincronizada" }).first(),
    ).toBeVisible();

    const statementDeleteResponse = await page.request.delete(
      `/api/owner-statements/${statementBody.data.id}`,
    );
    expect(statementDeleteResponse.status()).toBe(200);

    await page.goto("/statements");
    await expect(page.getByText("9300 EUR")).not.toBeVisible();
  });
});
