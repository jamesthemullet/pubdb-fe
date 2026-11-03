import { expect, test } from "@playwright/test";

const AUTH_ME_API = "**/auth/me";
const DASHBOARD_API = "**/auth/dashboard";
const USAGE_API = "**/auth/dashboard/usage**";

function mockAuthenticated(page: import("@playwright/test").Page) {
  return page.route(AUTH_ME_API, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ email: "user@example.com", approved: true }),
    })
  );
}

function mockUsage(page: import("@playwright/test").Page) {
  return page.route(USAGE_API, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ range: "30d", bucket: "day", series: [] }),
    })
  );
}

function apiKey(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "key_1",
    name: "My API Key",
    tier: "HOBBY",
    keyPrefix: "pk_test",
    isActive: true,
    keyStatus: "ACTIVE",
    createdAt: "2024-01-01T00:00:00.000Z",
    lastUsed: null,
    usageCount: 42,
    ...overrides,
  };
}

function dashboardResponse({
  apiKeys = [apiKey()],
  subscriptionTier = "HOBBY",
  remainingMonth = 9500,
  requestsPerMonth = 10000,
}: {
  apiKeys?: ReturnType<typeof apiKey>[];
  subscriptionTier?: string;
  remainingMonth?: number;
  requestsPerMonth?: number;
} = {}) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      apiKeys,
      user: {
        name: "Test User",
        username: "testuser",
        email: "test@example.com",
        approved: true,
        emailVerified: true,
      },
      subscription: {
        tier: subscriptionTier,
        limits: {
          requestsPerHour: 100,
          requestsPerDay: 1000,
          requestsPerMonth,
        },
        remaining: { hour: 58, day: 958, month: remainingMonth },
        resetTimes: {
          hour: "2024-01-01T01:00:00.000Z",
          day: "2024-01-02T00:00:00.000Z",
          month: "2024-02-01T00:00:00.000Z",
        },
        features: { allowLocationSearch: false, allowStats: false },
      },
      summary: { totalApiKeys: apiKeys.length, totalUsage: 42 },
    }),
  };
}

test.describe("Dashboard usage stats, tier badges and upgrade nudge (/profile)", () => {
  test("shows the monthly request usage stat card", async ({ page }) => {
    await mockAuthenticated(page);
    await mockUsage(page);
    await page.route(DASHBOARD_API, (route) =>
      route.fulfill(
        dashboardResponse({ remainingMonth: 9500, requestsPerMonth: 10000 })
      )
    );
    await page.goto("/profile");

    const requestsCard = page
      .locator('[class*="statCard"]')
      .filter({ hasText: "REQUESTS · 30D" });
    await expect(requestsCard).toBeVisible();
    // 10000 - 9500 remaining = 500 used, out of a 10k limit
    await expect(requestsCard).toContainText("500");
    await expect(requestsCard).toContainText("/10k");
  });

  test("shows each API key's own tier badge", async ({ page }) => {
    await mockAuthenticated(page);
    await mockUsage(page);
    await page.route(DASHBOARD_API, (route) =>
      route.fulfill(
        dashboardResponse({
          apiKeys: [
            apiKey({ id: "key_1", name: "Hobby Key", tier: "HOBBY" }),
            apiKey({ id: "key_2", name: "Dev Key", tier: "DEVELOPER" }),
          ],
        })
      )
    );
    await page.goto("/profile");

    const hobbyCard = page
      .locator('[class*="keyCard"]')
      .filter({ hasText: "Hobby Key" });
    const devCard = page
      .locator('[class*="keyCard"]')
      .filter({ hasText: "Dev Key" });

    await expect(hobbyCard.locator('[class*="tierBadge"]')).toHaveText(
      "HOBBY"
    );
    await expect(devCard.locator('[class*="tierBadge"]')).toHaveText(
      "DEVELOPER"
    );
  });

  test("shows the upgrade nudge once a HOBBY plan passes 75% of its monthly requests, and dismisses it", async ({
    page,
  }) => {
    await mockAuthenticated(page);
    await mockUsage(page);
    await page.route(DASHBOARD_API, (route) =>
      route.fulfill(
        dashboardResponse({ remainingMonth: 2000, requestsPerMonth: 10000 })
      )
    );
    await page.goto("/profile");

    await expect(page.getByText(/You.ve used 80% of your monthly/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Upgrade/ })
    ).toBeVisible();

    await page.getByRole("button", { name: "Dismiss upgrade prompt" }).click();
    await expect(
      page.getByText(/You.ve used 80% of your monthly/)
    ).not.toBeVisible();
  });

  test("does not show the upgrade nudge while usage is below the threshold", async ({
    page,
  }) => {
    await mockAuthenticated(page);
    await mockUsage(page);
    await page.route(DASHBOARD_API, (route) =>
      route.fulfill(
        dashboardResponse({ remainingMonth: 9500, requestsPerMonth: 10000 })
      )
    );
    await page.goto("/profile");

    await expect(page.getByText(/your monthly requests$/)).not.toBeVisible();
  });

  test("does not show the upgrade nudge on a non-HOBBY plan even at high usage", async ({
    page,
  }) => {
    await mockAuthenticated(page);
    await mockUsage(page);
    await page.route(DASHBOARD_API, (route) =>
      route.fulfill(
        dashboardResponse({
          subscriptionTier: "DEVELOPER",
          remainingMonth: 500,
          requestsPerMonth: 10000,
        })
      )
    );
    await page.goto("/profile");

    await expect(page.getByText(/your monthly requests$/)).not.toBeVisible();
  });
});
