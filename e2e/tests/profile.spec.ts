import { expect, test } from "@playwright/test";

const DASHBOARD_API = "**/auth/dashboard";
const AUTH_ME_API = "**/auth/me";

function mockAuthenticated(page: import("@playwright/test").Page, email = "user@example.com") {
  return page.route(AUTH_ME_API, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ email, approved: true }),
    })
  );
}

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
  test("shows sign-in form when unauthenticated", async ({ page }) => {
    await page.goto("/profile");
    // Unauthenticated state shows the AuthGate sign-in form
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  });

  test("shows no dashboard content when unauthenticated", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByText("Loading dashboard...")).not.toBeVisible();
    await expect(page.getByText("Dashboard")).not.toBeVisible();
  });

  test.describe("when authenticated", () => {
    test.beforeEach(async ({ page }) => {
      await mockAuthenticated(page);
      await page.route(DASHBOARD_API, (route) =>
        route.fulfill(dashboardResponse())
      );
      await page.goto("/profile");
      // Wait for dashboard data to load
      await page.getByText(/pk_test/).waitFor();
    });

    test("shows API key info when authenticated", async ({ page }) => {
      await expect(page.getByText(/pk_test/)).toBeVisible();
      await expect(page.getByText(/HOBBY/)).toBeVisible();
    });

  });

  test("shows error and Try Again button when dashboard API fails", async ({ page }) => {
    await mockAuthenticated(page);
    await page.route(DASHBOARD_API, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      })
    );
    await page.goto("/profile");
    await expect(page.getByText(/Error:/)).toBeVisible();
    await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
  });
});
