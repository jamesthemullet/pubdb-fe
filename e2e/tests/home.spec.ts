import { test, expect } from "@playwright/test";
import { setAuthToken, mockDashboardEndpoint } from "../fixtures/auth";

test.describe("Home page", () => {
  test("renders heading and welcome copy", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Pub DB", level: 1 })).toBeVisible();
    await expect(page.getByText(/welcome to pub db/i)).toBeVisible();
  });

  test.describe("Pricing — unauthenticated", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
    });

    test("shows all three tier names and prices", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "HOBBY" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "DEVELOPER" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "BUSINESS" })).toBeVisible();

      await expect(page.getByText("Free")).toBeVisible();
      await expect(page.getByText("$9/mo")).toBeVisible();
      await expect(page.getByText("$19/mo")).toBeVisible();
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
