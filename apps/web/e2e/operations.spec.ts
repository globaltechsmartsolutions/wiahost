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
    await page.locator("#guestEmail").fill(`${guestName.toLowerCase().replaceAll(" ", ".")}@example.com`);
    await page.locator("#checkIn").fill(isoDateFromToday(30));
    await page.locator("#checkOut").fill(isoDateFromToday(33));
    await page.locator("#guestsCount").fill("3");
    await page.locator("#nightlyRate").fill("155");
    await page.locator("#cleaningFee").fill("45");
    await page.locator("#taxesAmount").fill("12");
    await page.locator("#securityDeposit").fill("150");
    await page.locator('textarea[name="notes"]').fill("Reserva creada por Playwright para validar el flujo real.");
    await page.getByRole("button", { name: /crear reserva/i }).click();

    await expect(page).toHaveURL(/\/reservations\/[a-f0-9-]+$/);
    await expect(page.getByText(guestName)).toBeVisible();

    const response = await page.request.get("/api/reservations");
    expect(response.status()).toBe(200);

    const body = (await response.json()) as {
      data: Array<{ guest: string }>;
    };
    expect(body.data.some((reservation) => reservation.guest === guestName)).toBe(true);

    await page.goto(`/reservations?q=${encodeURIComponent(guestName)}`);
    await expect(page.getByText(`Mostrando 1 de`)).toBeVisible();
    await expect(page.getByText(guestName)).toBeVisible();
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
    const taskUpdateResponse = await page.request.patch(
      `/api/tasks/${taskBody.data.id}/status`,
      { data: { status: "done" } },
    );
    expect(taskUpdateResponse.status()).toBe(200);

    await page.goto(`/tasks/${taskBody.data.id}`);
    await expect(page.getByText(taskTitle)).toBeVisible();

    await page.goto(`/tasks?q=${encodeURIComponent(taskTitle)}&status=Cerrada`);
    await expect(page.getByText(`Mostrando 1 de`)).toBeVisible();
    await expect(page.getByText(taskTitle)).toBeVisible();

    const incidentTitle = uniqueName("E2E Incidencia");
    const incidentResponse = await page.request.post("/api/incidents", {
      data: {
        description: "Incidencia creada por Playwright para proteger el flujo de operaciones.",
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
    const incidentUpdateResponse = await page.request.patch(
      `/api/incidents/${incidentBody.data.id}/status`,
      { data: { status: "investigating" } },
    );
    expect(incidentUpdateResponse.status()).toBe(200);

    await page.goto(`/incidents/${incidentBody.data.id}`);
    await expect(page.getByText(incidentTitle)).toBeVisible();

    await page.goto(`/incidents?q=${encodeURIComponent(incidentTitle)}&status=Investigando`);
    await expect(page.getByText(`Mostrando 1 de`)).toBeVisible();
    await expect(page.getByText(incidentTitle)).toBeVisible();

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
});
