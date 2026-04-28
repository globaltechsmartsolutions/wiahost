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
});
