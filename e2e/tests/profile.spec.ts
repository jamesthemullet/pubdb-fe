import { test, expect } from "@playwright/test";
import { makeFakeJwt } from "../fixtures/auth";

const DASHBOARD_API = "**/auth/dashboard";

function dashboardResponse(tier = "HOBBY") {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      apiKeys: [
        {
          name: "My API Key",
          tier,
          keyPrefix: "pk_test",
          isActive: true,
          keyStatus: "ACTIVE",
          createdAt: "2024-01-01T00:00:00.000Z",
          lastUsed: null,
          usageCount: 42,
          limits: { requestsPerHour: 100, requestsPerDay: 1000, requestsPerMonth: 10000 },
          remaining: { hour: 58, day: 958, month: 9958 },
          resetTimes: { hour: "2024-01-01T01:00:00.000Z", day: "2024-01-02T00:00:00.000Z", month: "2024-02-01T00:00:00.000Z" },
          features: { allowLocationSearch: false, allowStats: false },
        },
      ],
      user: { name: "Test User", email: "test@example.com", approved: true },
      summary: { totalApiKeys: 1, totalUsage: 42 },
    }),
  };
}

test.describe("Profile page (/profile)", () => {
  test("shows the Profile heading regardless of auth state", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  });

  test("shows no dashboard content when unauthenticated", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByText("Loading dashboard...")).not.toBeVisible();
    await expect(page.getByText("Dashboard")).not.toBeVisible();
  });

  test.describe("when authenticated", () => {
    test.beforeEach(async ({ page }) => {
      const token = makeFakeJwt("user@example.com");
      await page.addInitScript((t) => {
        localStorage.setItem("token", t);
      }, token);
      await page.route(DASHBOARD_API, (route) =>
        route.fulfill(dashboardResponse())
      );
      await page.goto("/profile");
      // Wait for dashboard data to load
      await page.getByText(/pk_test/).waitFor();
    });

    test("shows the Dashboard heading and API key info", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
      await expect(page.getByText(/pk_test/)).toBeVisible();
      await expect(page.getByText(/HOBBY/)).toBeVisible();
    });

  });

  test("shows error and Try Again button when dashboard API fails", async ({ page }) => {
    const token = makeFakeJwt("user@example.com");
    await page.addInitScript((t) => {
      localStorage.setItem("token", t);
    }, token);
    await page.route(DASHBOARD_API, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      })
    );
    await page.goto("/profile");
    await expect(page.getByText(/Error loading dashboard/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Try Again" })).toBeVisible();
  });
});
