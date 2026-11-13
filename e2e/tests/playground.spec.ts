import { expect, test } from "@playwright/test";

const AUTH_ME_API = "**/auth/me";
const DASHBOARD_API = "**/auth/dashboard";
const BEER_TYPES_API = "**/api/playground/beer-types**";
const PUBS_NEAR_API = "**/api/playground/pubs/near**";

function mockAuthenticated(page: import("@playwright/test").Page) {
  return page.route(AUTH_ME_API, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ email: "test@example.com", approved: true }),
    })
  );
}

const SAMPLE_KEY = {
  id: "key_1",
  name: "My Key",
  tier: "DEVELOPER",
  keyPrefix: "pk_abc",
  isActive: true,
};

function mockDashboard(page: import("@playwright/test").Page) {
  return page.route(DASHBOARD_API, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ apiKeys: [SAMPLE_KEY] }),
    })
  );
}

test.describe("Playground (/playground)", () => {
  test("sends an immediate request for a parameterless endpoint and shows the response", async ({
    page,
  }) => {
    await mockAuthenticated(page);
    await mockDashboard(page);
    await page.route(BEER_TYPES_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "x-ratelimit-remaining": "99", "x-ratelimit-limit": "100" },
        body: JSON.stringify({ beerTypes: ["IPA", "Stout"] }),
      })
    );

    await page.goto("/playground");
    await page.getByLabel("Using key").waitFor();

    await page
      .locator('[class*="endpointGroup"]')
      .filter({ hasText: "/api/v1/beer-types" })
      .getByRole("button", { name: "Try it →" })
      .click();

    await expect(page.getByText("GET /api/v1/beer-types")).toBeVisible();
    await expect(page.getByText("200")).toBeVisible();
    await expect(page.getByText("99/100 left")).toBeVisible();
    await expect(page.getByText(/"IPA"/)).toBeVisible();
  });

  test("expands a param form for an endpoint with required fields and sends it once filled in", async ({
    page,
  }) => {
    await mockAuthenticated(page);
    await mockDashboard(page);
    await page.route(PUBS_NEAR_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ pubs: [] }),
      })
    );

    await page.goto("/playground");
    await page.getByLabel("Using key").waitFor();

    const nearRow = page
      .locator('[class*="endpointGroup"]')
      .filter({ hasText: "/api/v1/pubs/near" });
    await nearRow.getByRole("button", { name: "Configure →" }).click();

    const sendButton = page.getByRole("button", { name: "Send request →" });
    await expect(sendButton).toBeDisabled();

    await page.getByLabel("lat *").fill("51.5074");
    await page.getByLabel("lng *").fill("-0.1278");
    await expect(sendButton).toBeEnabled();

    await sendButton.click();
    await expect(page.getByText("GET /api/v1/pubs/near")).toBeVisible();
  });

  test("shows the viewer's response history and lets them revisit a previous result", async ({
    page,
  }) => {
    await mockAuthenticated(page);
    await mockDashboard(page);
    await page.route(BEER_TYPES_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ beerTypes: ["IPA"] }),
      })
    );

    await page.goto("/playground");
    await page.getByLabel("Using key").waitFor();

    await page
      .locator('[class*="endpointGroup"]')
      .filter({ hasText: "/api/v1/beer-types" })
      .getByRole("button", { name: "Try it →" })
      .click();
    await page.getByText("GET /api/v1/beer-types").waitFor();

    await page.getByRole("button", { name: /Show history \(1\)/ }).click();
    await expect(
      page.getByRole("button").filter({ hasText: "GET /api/v1/beer-types" })
    ).toBeVisible();
  });
});
