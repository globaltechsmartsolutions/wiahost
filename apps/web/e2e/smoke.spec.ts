import { expect, test } from "@playwright/test";

import { isoDateFromToday, signInAsDemoOperator, uniqueName } from "./helpers";

test.describe("public and auth smoke @smoke", () => {
  test("loads the public landing, login and register pages", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /centro de mando/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { exact: true, name: "Entrar" }),
    ).toBeVisible();

    await page.goto("/login");
    await expect(page.getByText("Entrar en WIAHost")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    await page.goto("/register");
    await expect(page.getByText("Crear espacio WIAHost")).toBeVisible();
    await expect(page.locator("#role")).toBeVisible();
  });

  test("redirects anonymous users from protected routes to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('input[name="next"]')).toHaveValue("/dashboard");
  });

  test("logs in with the demo operator and opens the dashboard", async ({
    page,
  }) => {
    await signInAsDemoOperator(page);
    await expect(
      page.getByText(/centro de mando en tiempo real/i),
    ).toBeVisible();
    await expect(page.getByText(/multi-calendario operativo/i)).toBeVisible();
  });

  test("submits a public direct booking inquiry", async ({ page }) => {
    const guestName = uniqueName("E2E Directo");

    await page.goto("/book/loft-malaga-centro");
    await expect(
      page.getByRole("heading", { name: /loft malaga centro/i }),
    ).toBeVisible();
    await expect(page.getByText(/solicitar reserva/i)).toBeVisible();

    await page.locator("#guestFullName").fill(guestName);
    await page
      .locator("#guestEmail")
      .fill(`${guestName.toLowerCase().replaceAll(" ", ".")}@example.com`);
    await page.locator("#guestPhone").fill("+34611111111");
    await page.locator("#checkIn").fill(isoDateFromToday(45));
    await page.locator("#checkOut").fill(isoDateFromToday(48));
    await page.locator("#guestsCount").fill("2");
    await page
      .locator("#message")
      .fill("Solicitud directa creada por Playwright.");
    await page.locator('input[name="consent"]').check();
    await page.getByRole("button", { name: /enviar solicitud/i }).click();

    await expect(page).toHaveURL(/\/book\/loft-malaga-centro\?sent=1$/);
    await expect(page.getByText(/solicitud enviada/i)).toBeVisible();
  });

  test("serves a public iCal availability feed without guest data", async ({
    page,
  }) => {
    const response = await page.request.get("/api/ical/loft-malaga-centro");

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/calendar");

    const body = await response.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("VERSION:2.0");
    expect(body).toContain("SUMMARY:Reservado");
    expect(body.toLowerCase()).not.toContain("sofia");
  });
});
