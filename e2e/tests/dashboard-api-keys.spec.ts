import { expect, test } from "@playwright/test";

const AUTH_ME_API = "**/auth/me";
const DASHBOARD_API = "**/auth/dashboard";
const ADD_KEY_API = "**/auth/keys";
const REGENERATE_API = "**/regenerate";

function mockAuthenticated(page: import("@playwright/test").Page) {
  return page.route(AUTH_ME_API, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ email: "test@example.com", approved: true }),
    })
  );
}

type MockApiKey = {
  id: string;
  name: string;
  tier: string;
  keyPrefix: string;
  isActive: boolean;
  keyStatus: string;
  createdAt: string;
  lastUsed: string | null;
  usageCount: number;
};

function dashboardResponse(apiKeys: MockApiKey[], tier = "DEVELOPER") {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      apiKeys,
      subscription: {
        tier,
        limits: { requestsPerHour: 1000, requestsPerDay: 10000, requestsPerMonth: 100000 },
        remaining: { hour: 900, day: 9000, month: 90000 },
        resetTimes: {
          hour: "2024-01-01T01:00:00.000Z",
          day: "2024-01-02T00:00:00.000Z",
          month: "2024-02-01T00:00:00.000Z",
        },
        features: { allowLocationSearch: true, allowStats: true },
      },
      user: {
        name: "Test User",
        username: "testuser",
        email: "test@example.com",
        approved: true,
        emailVerified: true,
      },
      summary: { totalApiKeys: apiKeys.length, totalUsage: 0 },
    }),
  };
}

test.describe("Dashboard API key management (/profile)", () => {
  test("creates a new API key via the Add key modal", async ({ page }) => {
    await mockAuthenticated(page);
    const existingKey: MockApiKey = {
      id: "key_1",
      name: "Existing Key",
      tier: "DEVELOPER",
      keyPrefix: "pk_dev",
      isActive: true,
      keyStatus: "ACTIVE",
      createdAt: "2024-01-01T00:00:00.000Z",
      lastUsed: null,
      usageCount: 5,
    };
    await page.route(DASHBOARD_API, (route) =>
      route.fulfill(dashboardResponse([existingKey]))
    );
    await page.route(ADD_KEY_API, (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          apiKey: {
            name: "Staging key",
            tier: "DEVELOPER",
            keyStatus: "ACTIVE",
            keyPrefix: "pk_new",
            key: "pk_new_supersecretkey",
            permissions: ["read"],
          },
        }),
      })
    );

    await page.goto("/profile");
    await page.getByText("Existing Key").waitFor();

    await page.getByRole("button", { name: "+ Add key" }).first().click();
    await expect(page.getByText("Add a new API key")).toBeVisible();

    await page.getByLabel("API key name").fill("Staging key");
    await page.getByRole("button", { name: "Create key" }).click();

    await expect(page.getByText("New API key generated")).toBeVisible();
    await expect(page.getByText("pk_new_supersecretkey")).toBeVisible();
  });

  test("regenerates an existing API key", async ({ page }) => {
    await mockAuthenticated(page);
    const existingKey: MockApiKey = {
      id: "key_1",
      name: "Existing Key",
      tier: "HOBBY",
      keyPrefix: "pk_hobby",
      isActive: true,
      keyStatus: "ACTIVE",
      createdAt: "2024-01-01T00:00:00.000Z",
      lastUsed: null,
      usageCount: 5,
    };
    await page.route(DASHBOARD_API, (route) =>
      route.fulfill(dashboardResponse([existingKey], "HOBBY"))
    );
    await page.route(REGENERATE_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "New key generated.",
          apiKey: {
            name: "Existing Key",
            tier: "HOBBY",
            keyStatus: "ACTIVE",
            keyPrefix: "pk_hobby",
            key: "pk_hobby_newsecret",
            permissions: [],
          },
        }),
      })
    );

    await page.goto("/profile");
    await page.getByText("Existing Key").waitFor();

    await page.getByRole("button", { name: "Regenerate API key" }).click();

    await expect(page.getByText("New API key generated")).toBeVisible();
    await expect(page.getByText("pk_hobby_newsecret")).toBeVisible();

    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByText("New API key generated")).not.toBeVisible();
  });
});
