import { expect, test } from "@playwright/test";
import { makeFakeJwt } from "../fixtures/auth";

const AUTH_ME_API = "**/api/auth/me";
const DASHBOARD_API = "**/auth/dashboard";
const PLAYGROUND_PUBS_API = "**/playground/pubs**";

function authenticate(page: import("@playwright/test").Page, email: string) {
  const token = makeFakeJwt(email);
  return Promise.all([
    page.addInitScript((t) => {
      localStorage.setItem("token", t);
    }, token),
    page.route(AUTH_ME_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ email, approved: true }),
      })
    ),
  ]);
}

function dashboardResponse(apiKeys: unknown[]) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      apiKeys,
      user: { name: "Test User", email: "test@example.com", approved: true },
      summary: { totalApiKeys: apiKeys.length, totalUsage: 0 },
    }),
  };
}

const ONE_KEY = [
  { id: "key_1", name: "My API Key", tier: "DEVELOPER", keyPrefix: "pk_test", isActive: true },
];

test.describe("Playground page (/playground)", () => {
  test("shows sign-in form when unauthenticated", async ({ page }) => {
    await page.goto("/playground");
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  });

  test("shows a CTA to create a key when authenticated with no keys", async ({ page }) => {
    await authenticate(page, "user@example.com");
    await page.route(DASHBOARD_API, (route) => route.fulfill(dashboardResponse([])));

    await page.goto("/playground");

    await expect(page.getByText(/don't have an API key yet/i)).toBeVisible();
  });

  test.describe("when authenticated with an API key", () => {
    test.beforeEach(async ({ page }) => {
      await authenticate(page, "user@example.com");
      await page.route(DASHBOARD_API, (route) => route.fulfill(dashboardResponse(ONE_KEY)));
      await page.goto("/playground");
      await page.getByRole("combobox", { name: "Using key" }).waitFor();
    });

    test("shows the key picker populated with the key", async ({ page }) => {
      const picker = page.getByRole("combobox", { name: "Using key" });
      await expect(picker).toBeVisible();
      await expect(picker).toHaveValue("key_1");
    });

    test("Try it on GET /pubs shows a live response", async ({ page }) => {
      // /api/v1/pubs is the default active endpoint on load, so no row click needed.
      await page.route(PLAYGROUND_PUBS_API, (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: [{ id: "pub_1", name: "The Crown" }] }),
        })
      );

      await page.getByRole("button", { name: "Send" }).click();

      await expect(page.getByText("200", { exact: true })).toBeVisible();
      await expect(page.getByText(/The Crown/)).toBeVisible();
    });

    test("shows the upstream error when the request fails", async ({ page }) => {
      await page.route(PLAYGROUND_PUBS_API, (route) =>
        route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: "API key not found" }),
        })
      );

      await page.getByRole("button", { name: "Send" }).click();

      await expect(page.getByText("404", { exact: true })).toBeVisible();
      await expect(page.getByText(/API key not found/)).toBeVisible();
    });

    test("Selecting an endpoint loads it into the request bar", async ({ page }) => {
      await expect(
        page.getByText("https://api.thepubdb.com/api/v1/pubs?limit=10", { exact: true })
      ).toBeVisible();

      await page.getByText("/api/v1/beer-types", { exact: true }).click();

      await expect(
        page.getByText("https://api.thepubdb.com/api/v1/beer-types", { exact: true })
      ).toBeVisible();
      await expect(
        page.getByText("https://api.thepubdb.com/api/v1/pubs?limit=10", { exact: true })
      ).not.toBeVisible();
    });

    test("Selecting pubs/near requires lat and lng before sending", async ({ page }) => {
      await page.getByText("/api/v1/pubs/near", { exact: true }).click();

      const sendBtn = page.getByRole("button", { name: "Send" });
      await expect(sendBtn).toBeDisabled();

      await page.getByPlaceholder("51.5074").fill("51.5");
      await expect(sendBtn).toBeDisabled();

      await page.getByPlaceholder("-0.1278").fill("-0.12");
      await expect(sendBtn).toBeEnabled();
    });
  });
});
