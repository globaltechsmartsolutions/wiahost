import { expect, test } from "@playwright/test";

import { signInAsDemoOperator } from "./helpers";

test.describe("public and auth smoke @smoke", () => {
  test("loads the public landing, login and register pages", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /centro de mando/i })).toBeVisible();
    await expect(page.getByRole("link", { exact: true, name: "Entrar" })).toBeVisible();

    await page.goto("/login");
    await expect(page.getByText("Entrar en WIAHost")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    await page.goto("/register");
    await expect(page.getByText("Crear espacio WIAHost")).toBeVisible();
    await expect(page.locator("#role")).toBeVisible();
  });

  test("redirects anonymous users from protected routes to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('input[name="next"]')).toHaveValue("/dashboard");
  });

  test("logs in with the demo operator and opens the dashboard", async ({ page }) => {
    await signInAsDemoOperator(page);
    await expect(page.getByText(/centro de mando en tiempo real/i)).toBeVisible();
    await expect(page.getByText(/multi-calendario operativo/i)).toBeVisible();
  });
});
