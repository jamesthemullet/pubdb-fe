import { expect, test } from "@playwright/test";
import { mockDashboardEndpoint, setAuthToken } from "../fixtures/auth";

test.describe("Home page", () => {
  test("renders heading and hero description", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("The pub database");
    await expect(page.getByText(/a clean rest api/i)).toBeVisible();
  });

  test.describe("Pricing — unauthenticated", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
    });

    test("shows all three tier names and prices", async ({ page }) => {
      await expect(page.getByText("HOBBY", { exact: true })).toBeVisible();
      await expect(page.getByText("DEVELOPER", { exact: true })).toBeVisible();
      await expect(page.getByText("BUSINESS", { exact: true })).toBeVisible();

      await expect(page.getByText("£0")).toBeVisible();
      await expect(page.getByText("£9")).toBeVisible();
      await expect(page.getByText("£19")).toBeVisible();
    });

    test("shows feature lists for each tier", async ({ page }) => {
      await expect(page.getByText("20 requests/hour")).toBeVisible();
      await expect(page.getByText("1,000 requests/hour")).toBeVisible();
      await expect(page.getByText("5,000 requests/hour")).toBeVisible();
    });

    test("shows Subscribe button for each tier", async ({ page }) => {
      const subscribeBtns = page.getByRole("button", { name: "Subscribe" });
      await expect(subscribeBtns).toHaveCount(3);
    });
  });

  test.describe("Pricing — authenticated", () => {
    test("shows Current plan for the user's active tier", async ({ page }) => {
      await mockDashboardEndpoint(page, "HOBBY");
      await setAuthToken(page, "tester@example.com");
      await page.goto("/");

      await expect(page.getByRole("button", { name: "Current plan" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Upgrade to developer" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Upgrade to business" })).toBeVisible();
    });
  });
});
