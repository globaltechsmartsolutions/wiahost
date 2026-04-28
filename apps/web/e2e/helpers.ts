import { expect, type Page } from "@playwright/test";

export const demoOperator = {
  email: "operaciones@wiahost.local",
  password: "Password123!",
};

export const seedIds = {
  conversationId: "50000000-0000-0000-0000-000000000001",
  propertyId: "20000000-0000-0000-0000-000000000001",
  reservationId: "40000000-0000-0000-0000-000000000001",
};

export async function signInAsDemoOperator(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill(demoOperator.email);
  await page.locator("#password").fill(demoOperator.password);
  await page.getByRole("button", { name: /entrar al panel/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /prioridades/i })).toBeVisible();
}

export function uniqueName(prefix: string) {
  return `${prefix} ${Date.now().toString(36)}`;
}

export function isoDateFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
