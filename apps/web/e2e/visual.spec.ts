import { expect, test, type Page } from "@playwright/test";

import { signInAsDemoOperator } from "./helpers";

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

async function expectBottomAligned(page: Page, firstTestId: string, secondTestId: string) {
  const first = await page.getByTestId(firstTestId).boundingBox();
  const second = await page.getByTestId(secondTestId).boundingBox();

  expect(first).not.toBeNull();
  expect(second).not.toBeNull();

  const firstBottom = first!.y + first!.height;
  const secondBottom = second!.y + second!.height;

  expect(Math.abs(firstBottom - secondBottom)).toBeLessThanOrEqual(2);
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

  test("dashboard viewport has no desktop overflow", async ({ page }, testInfo) => {
    await page.setViewportSize({ height: 900, width: 1440 });
    await signInAsDemoOperator(page);
    await page.goto("/dashboard");
    await prepareVisualPage(page);
    await expectNoHorizontalOverflow(page);
    await expectBottomAligned(page, "dashboard-calendar-card", "dashboard-priority-card");
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath("dashboard-current.png"),
    });
  });
});
