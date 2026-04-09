import { expect, test } from "@playwright/test";
import { makeFakeJwt } from "../fixtures/auth";

// The detail page fetches from localhost:4000/pubs/42 (the API),
// while the browser navigates to localhost:3000/pubs/42 (Next.js).
// Matching on port 4000 prevents us from intercepting the page navigation.
const PUB_API = (url: URL) => url.port === "4000" && url.pathname === "/pubs/42";
const AUTH_ME_API = (url: URL) => url.port === "4000" && url.pathname === "/auth/me";
const COUNTRIES_API = (url: URL) => url.href.includes("restcountries.com");
const BEER_TYPES_API = (url: URL) => url.pathname === "/api/beer-types";

const fakePub = {
  id: "42",
  name: "The Anchor",
  city: "Bristol",
  address: "5 King Street",
  postcode: "BS1 4EF",
  country: "GB",
  createdAt: "2024-01-15T10:00:00.000Z",
};

function pubResponse(pub = fakePub, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(pub),
  };
}

function silenceSecondaryAPIs(page: import("@playwright/test").Page) {
  return Promise.all([
    page.route(COUNTRIES_API, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    ),
    page.route(BEER_TYPES_API, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    ),
  ]);
}

test.describe("Pub detail (/pubs/[id])", () => {
  test("shows loading state before fetch resolves", async ({ page }) => {
    await page.route(PUB_API, () => {}); // never resolves
    await silenceSecondaryAPIs(page);
    await page.goto("/pubs/42");
    await expect(page.getByText("Loading pub details…")).toBeVisible();
  });

  test("shows pub not found when API returns 404", async ({ page }) => {
    await page.route(PUB_API, (route) =>
      route.fulfill({ status: 404, contentType: "application/json", body: "{}" })
    );
    await silenceSecondaryAPIs(page);
    await page.goto("/pubs/42");
    await expect(page.getByText("Pub not found")).toBeVisible();
  });

  test("shows log-in prompt for unauthenticated visitors", async ({ page }) => {
    await page.route(PUB_API, (route) => route.fulfill(pubResponse()));
    await silenceSecondaryAPIs(page);
    await page.goto("/pubs/42");
    await page.getByRole("heading", { name: "The Anchor" }).waitFor();
    await expect(page.getByRole("link", { name: "Log in to edit this pub" })).toBeVisible();
  });

  test.describe("with an authenticated approved user", () => {
    test.beforeEach(async ({ page }) => {
      // Seed a token so EditButton can read it from localStorage
      const token = makeFakeJwt("editor@example.com");
      await page.addInitScript((t) => {
        localStorage.setItem("token", t);
      }, token);

      await page.route(AUTH_ME_API, (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ email: "editor@example.com", approved: true, admin: false }),
        })
      );
      await page.route(PUB_API, (route) => route.fulfill(pubResponse()));
      await silenceSecondaryAPIs(page);
      await page.goto("/pubs/42");
      await page.getByRole("heading", { name: "The Anchor" }).waitFor();
    });

    test("renders pub name, city, address, and edit button", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "The Anchor" })).toBeVisible();
      await expect(page.getByText(/Bristol/)).toBeVisible();
      await expect(page.getByText(/5 King Street/)).toBeVisible();
      await expect(page.getByRole("button", { name: "Edit this pub" })).toBeVisible();
    });

    test("clicking Edit shows Save and Cancel buttons", async ({ page }) => {
      await page.getByRole("button", { name: "Edit this pub" }).click();
      await expect(page.getByRole("button", { name: "Save" }).first()).toBeVisible();
      await expect(page.getByRole("button", { name: "Cancel" }).first()).toBeVisible();
    });

    test("Cancel exits edit mode and returns to view", async ({ page }) => {
      await page.getByRole("button", { name: "Edit this pub" }).click();
      await page.getByRole("button", { name: "Cancel" }).first().click();
      await expect(
        page.getByRole("button", { name: "Edit this pub" })
      ).toBeVisible();
    });
  });
});
