import { expect, test, type Page } from "@playwright/test";

import { seedIds, signInAsDemoOperator } from "./helpers";

async function prepareVisualPage(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    const documentElement = document.documentElement;
    return documentElement.scrollWidth > documentElement.clientWidth + 1;
  });

  expect(hasOverflow).toBe(false);
}

async function expectNoElementHorizontalOverflow(page: Page, testId: string) {
  const hasOverflow = await page.getByTestId(testId).evaluate((element) => {
    return element.scrollWidth > element.clientWidth + 1;
  });

  expect(hasOverflow).toBe(false);
}

async function expectBottomAligned(
  page: Page,
  firstTestId: string,
  secondTestId: string,
) {
  const first = await page.getByTestId(firstTestId).boundingBox();
  const second = await page.getByTestId(secondTestId).boundingBox();

  expect(first).not.toBeNull();
  expect(second).not.toBeNull();

  const firstBottom = first!.y + first!.height;
  const secondBottom = second!.y + second!.height;

  expect(Math.abs(firstBottom - secondBottom)).toBeLessThanOrEqual(2);
}

async function expectDashboardGridGaps(page: Page) {
  const result = await page
    .getByTestId("dashboard-content-grid")
    .evaluate((grid) => {
      const styles = window.getComputedStyle(grid);
      const columnGap = Number.parseFloat(styles.columnGap);
      const rowGap = Number.parseFloat(styles.rowGap);
      const children = Array.from(grid.children).map((child) => {
        const rect = child.getBoundingClientRect();

        return {
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          top: rect.top,
        };
      });

      const rows = new Map<number, typeof children>();
      for (const child of children) {
        const key = Math.round(child.top);
        rows.set(key, [...(rows.get(key) ?? []), child]);
      }

      const rowValues = Array.from(rows.entries())
        .map(([top, items]) => ({
          items: items.sort((first, second) => first.left - second.left),
          maxBottom: Math.max(...items.map((item) => item.bottom)),
          top,
        }))
        .sort((first, second) => first.top - second.top);

      const horizontalGaps = rowValues.flatMap((row) =>
        row.items
          .slice(1)
          .map((item, index) => item.left - row.items[index].right),
      );
      const verticalGaps = rowValues
        .slice(1)
        .map((row, index) => row.top - rowValues[index].maxBottom);

      return {
        columnGap,
        horizontalGaps,
        rowGap,
        verticalGaps,
      };
    });

  for (const gap of result.horizontalGaps) {
    expect(Math.abs(gap - result.columnGap)).toBeLessThanOrEqual(2);
  }

  for (const gap of result.verticalGaps) {
    expect(Math.abs(gap - result.rowGap)).toBeLessThanOrEqual(2);
  }
}

async function expectDashboardLaptopScale(page: Page) {
  const scale = await page.evaluate(() => {
    const heroTitle = document.querySelector(
      "[data-testid='dashboard-hero-title']",
    );
    const calendarCard = document.querySelector(
      "[data-testid='dashboard-calendar-card']",
    );
    const metricCards = Array.from(
      document.querySelectorAll("[data-testid='dashboard-metric-card']"),
    );
    const metricRects = metricCards.map((card) => card.getBoundingClientRect());
    const firstMetricTop = Math.round(metricRects[0]?.top ?? 0);

    return {
      calendarTop: calendarCard?.getBoundingClientRect().top ?? 0,
      heroFontSize: Number.parseFloat(
        window.getComputedStyle(heroTitle!).fontSize,
      ),
      metricHeights: metricRects.map((rect) => rect.height),
      metricsInFirstRow: metricRects.filter(
        (rect) => Math.abs(Math.round(rect.top) - firstMetricTop) <= 2,
      ).length,
    };
  });

  expect(scale.calendarTop).toBeLessThanOrEqual(520);
  expect(scale.heroFontSize).toBeLessThanOrEqual(44);
  expect(Math.max(...scale.metricHeights)).toBeLessThanOrEqual(125);
  expect(scale.metricsInFirstRow).toBe(4);
}

test.describe("visual regression baseline @visual", () => {
  test("landing desktop stays visually stable", async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 1440 });
    await page.goto("/");
    await prepareVisualPage(page);
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot("landing-desktop.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test("landing mobile stays visually stable", async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 390 });
    await page.goto("/");
    await prepareVisualPage(page);
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot("landing-mobile.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test("auth screens stay visually stable", async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 600 });

    await page.goto("/login");
    await prepareVisualPage(page);
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot("login.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });

    await page.goto("/register");
    await prepareVisualPage(page);
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot("register.png", {
      animations: "disabled",
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test("dashboard viewport has no desktop overflow", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: 900, width: 1920 });
    await signInAsDemoOperator(page);
    await page.goto("/dashboard");
    await prepareVisualPage(page);
    await expectNoHorizontalOverflow(page);
    await expectNoElementHorizontalOverflow(page, "dashboard-calendar-scroll");
    await expectBottomAligned(
      page,
      "dashboard-calendar-card",
      "dashboard-priority-card",
    );
    await expectDashboardGridGaps(page);
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("dashboard-current.png"),
    });
  });

  test("dashboard standard desktop sizes avoid cramped calendar scrollbars", async ({
    page,
  }) => {
    await signInAsDemoOperator(page);

    for (const viewport of [
      { height: 768, width: 1366 },
      { height: 900, width: 1440 },
      { height: 900, width: 1536 },
      { height: 1080, width: 1920 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/dashboard");
      await prepareVisualPage(page);
      await expectNoHorizontalOverflow(page);
      await expectNoElementHorizontalOverflow(
        page,
        "dashboard-calendar-scroll",
      );
      await expectDashboardGridGaps(page);
      if (viewport.width < 1800) {
        await expectDashboardLaptopScale(page);
      }
    }
  });

  test("operations routes keep responsive density without desktop overflow", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: 768, width: 1366 });
    await signInAsDemoOperator(page);

    for (const route of ["/reservations", "/tasks", "/incidents", "/inbox"]) {
      await page.goto(route);
      await prepareVisualPage(page);
      await expectNoHorizontalOverflow(page);
      await expect(
        page.getByRole("button", { name: /filtrar/i }),
      ).toBeVisible();
      await page.screenshot({
        fullPage: false,
        path: testInfo.outputPath(`${route.replace("/", "")}-density.png`),
      });
    }
  });

  test("operation detail and edit routes keep responsive density without desktop overflow", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: 768, width: 1366 });
    await signInAsDemoOperator(page);

    for (const route of [
      `/reservations/${seedIds.reservationId}`,
      `/reservations/${seedIds.reservationId}/edit`,
      `/tasks/${seedIds.taskId}`,
      `/tasks/${seedIds.taskId}/edit`,
      `/incidents/${seedIds.incidentId}`,
      `/incidents/${seedIds.incidentId}/edit`,
    ]) {
      await page.goto(route);
      await prepareVisualPage(page);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        fullPage: false,
        path: testInfo.outputPath(
          `${route.replaceAll("/", "-").replace(":", "")}-density.png`,
        ),
      });
    }
  });

  test("property management routes keep responsive density without desktop overflow", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: 768, width: 1366 });
    await signInAsDemoOperator(page);

    for (const route of [
      "/properties",
      `/properties/${seedIds.propertyId}`,
      `/properties/${seedIds.propertyId}/edit`,
    ]) {
      await page.goto(route);
      await prepareVisualPage(page);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        fullPage: false,
        path: testInfo.outputPath(
          `${route.replaceAll("/", "-").replace(":", "")}-density.png`,
        ),
      });
    }
  });

  test("owner and settings routes keep responsive density without desktop overflow", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: 768, width: 1366 });
    await signInAsDemoOperator(page);

    for (const route of ["/owners", "/settings"]) {
      await page.goto(route);
      await prepareVisualPage(page);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        fullPage: false,
        path: testInfo.outputPath(`${route.replace("/", "")}-density.png`),
      });
    }
  });

  test("calendar and guests routes keep responsive density without desktop overflow", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: 768, width: 1366 });
    await signInAsDemoOperator(page);

    for (const route of ["/calendar", "/guests"]) {
      await page.goto(route);
      await prepareVisualPage(page);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        fullPage: false,
        path: testInfo.outputPath(`${route.replace("/", "")}-density.png`),
      });
    }
  });
});
