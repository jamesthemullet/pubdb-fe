import { expect, test } from "@playwright/test";

const AUTH_ME_API = "**/auth/me";
const PUBS_API = (url: URL) => url.href.includes("/pubs?limit=");
const SAVED_SEARCHES_API = "**/auth/me/saved-searches";
const SAVED_SEARCH_ITEM_API = "**/auth/me/saved-searches/*";

function mockAuthenticated(page: import("@playwright/test").Page) {
  return page.route(AUTH_ME_API, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ email: "test@example.com", approved: true }),
    })
  );
}

function mockPubs(page: import("@playwright/test").Page) {
  return page.route(PUBS_API, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [{ id: "1", name: "The Harp", city: "London", address: "47 Chandos Place", country: "GB" }],
      }),
    })
  );
}

type MockSavedSearch = {
  id: string;
  name: string;
  params: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

function savedSearchesResponse(savedSearches: MockSavedSearch[]) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ savedSearches }),
  };
}

const EXISTING_SEARCH: MockSavedSearch = {
  id: "ss_1",
  name: "My Harp search",
  params: { search: "Harp" },
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

test.describe("Saved searches (/pubs)", () => {
  test("saves the current search and marks it as saved", async ({ page }) => {
    await mockAuthenticated(page);
    await mockPubs(page);
    await page.route(SAVED_SEARCHES_API, (route) => {
      const method = route.request().method();
      if (method === "GET") return route.fulfill(savedSearchesResponse([]));
      if (method === "POST") {
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            savedSearch: {
              id: "ss_new",
              name: "Harp",
              params: { search: "Harp" },
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-01T00:00:00.000Z",
            },
          }),
        });
      }
      return route.fallback();
    });

    await page.goto("/pubs");
    await page.getByRole("searchbox", { name: "Search pubs" }).fill("Harp");

    await page.getByRole("button", { name: "Save this search" }).click();
    await page.getByLabel("Name this search").fill("Harp");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("button", { name: "Search saved" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Saved searches (1)" })).toBeVisible();
  });

  test("re-applies a saved search", async ({ page }) => {
    await mockAuthenticated(page);
    await mockPubs(page);
    await page.route(SAVED_SEARCHES_API, (route) =>
      route.fulfill(savedSearchesResponse([EXISTING_SEARCH]))
    );

    await page.goto("/pubs");
    await page.getByRole("button", { name: "Saved searches (1)" }).click();
    await page.getByRole("link", { name: "My Harp search" }).click();

    await expect(page.getByRole("searchbox", { name: "Search pubs" })).toHaveValue("Harp");
  });

  test("renames a saved search", async ({ page }) => {
    await mockAuthenticated(page);
    await mockPubs(page);
    await page.route(SAVED_SEARCHES_API, (route) =>
      route.fulfill(savedSearchesResponse([EXISTING_SEARCH]))
    );
    await page.route(SAVED_SEARCH_ITEM_API, (route) => {
      if (route.request().method() !== "PATCH") return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          savedSearch: { ...EXISTING_SEARCH, name: "Renamed search" },
        }),
      });
    });

    await page.goto("/pubs");
    await page.getByRole("button", { name: "Saved searches (1)" }).click();
    await page.getByRole("button", { name: "Rename My Harp search" }).click();
    await page.getByLabel("New name for My Harp search").fill("Renamed search");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("link", { name: "Renamed search" })).toBeVisible();
  });

  test("deletes a saved search", async ({ page }) => {
    await mockAuthenticated(page);
    await mockPubs(page);
    await page.route(SAVED_SEARCHES_API, (route) =>
      route.fulfill(savedSearchesResponse([EXISTING_SEARCH]))
    );
    await page.route(SAVED_SEARCH_ITEM_API, (route) => {
      if (route.request().method() !== "DELETE") return route.fallback();
      return route.fulfill({ status: 204, body: "" });
    });

    await page.goto("/pubs");
    await page.getByRole("button", { name: "Saved searches (1)" }).click();
    await page.getByRole("button", { name: "Delete My Harp search" }).click();

    await expect(page.getByRole("link", { name: "My Harp search" })).not.toBeVisible();
    await expect(page.getByText("No saved searches yet.")).toBeVisible();
  });
});
