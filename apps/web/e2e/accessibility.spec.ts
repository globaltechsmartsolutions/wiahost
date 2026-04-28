import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { seedIds, signInAsDemoOperator } from "./helpers";

type AccessibilityRoute = {
  name: string;
  path: string;
  requiresAuth?: boolean;
};

const routes: AccessibilityRoute[] = [
  { name: "landing", path: "/" },
  { name: "login", path: "/login" },
  { name: "register", path: "/register" },
  { name: "dashboard", path: "/dashboard", requiresAuth: true },
  { name: "calendar", path: "/calendar", requiresAuth: true },
  { name: "properties", path: "/properties", requiresAuth: true },
  { name: "new property", path: "/properties/new", requiresAuth: true },
  {
    name: "property detail",
    path: `/properties/${seedIds.propertyId}`,
    requiresAuth: true,
  },
  {
    name: "edit property",
    path: `/properties/${seedIds.propertyId}/edit`,
    requiresAuth: true,
  },
  { name: "reservations", path: "/reservations", requiresAuth: true },
  {
    name: "reservation detail",
    path: `/reservations/${seedIds.reservationId}`,
    requiresAuth: true,
  },
  {
    name: "edit reservation",
    path: `/reservations/${seedIds.reservationId}/edit`,
    requiresAuth: true,
  },
  { name: "inbox", path: "/inbox", requiresAuth: true },
  { name: "guests", path: "/guests", requiresAuth: true },
  {
    name: "guest detail",
    path: `/guests/${seedIds.guestId}`,
    requiresAuth: true,
  },
  {
    name: "edit guest",
    path: `/guests/${seedIds.guestId}/edit`,
    requiresAuth: true,
  },
  { name: "tasks", path: "/tasks", requiresAuth: true },
  { name: "task detail", path: `/tasks/${seedIds.taskId}`, requiresAuth: true },
  {
    name: "edit task",
    path: `/tasks/${seedIds.taskId}/edit`,
    requiresAuth: true,
  },
  { name: "incidents", path: "/incidents", requiresAuth: true },
  {
    name: "incident detail",
    path: `/incidents/${seedIds.incidentId}`,
    requiresAuth: true,
  },
  {
    name: "edit incident",
    path: `/incidents/${seedIds.incidentId}/edit`,
    requiresAuth: true,
  },
  { name: "owners", path: "/owners", requiresAuth: true },
  { name: "settings", path: "/settings", requiresAuth: true },
];

function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
) {
  return violations.map((violation) => ({
    description: violation.description,
    help: violation.help,
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => ({
      html: node.html,
      target: node.target,
    })),
  }));
}

async function analyzePage(page: Page) {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
}

test.describe("accessibility audit @a11y", () => {
  for (const route of routes) {
    test(`${route.name} has no critical WCAG violations`, async ({ page }) => {
      test.setTimeout(90_000);

      if (route.requiresAuth) {
        await signInAsDemoOperator(page);
      }

      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.locator("body").waitFor();

      const result = await analyzePage(page);
      const blockingViolations = result.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      );

      expect(formatViolations(blockingViolations)).toEqual([]);
    });
  }
});
