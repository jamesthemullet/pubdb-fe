import { expect, test } from "@playwright/test";

// Chains /pubs search (covered in isolation by pubs-list.spec.ts) with
// /pubs/[id] inline editing (covered in isolation by pub-detail.spec.ts)
// into one flow: search results -> open pub -> edit -> back to list ->
// verify the edited name is reflected.
// Match on pathname: once a search is set the query string starts with
// `search=`, so a `/pubs?limit=` substring match would miss it.
const PUBS_LIST_API = (url: URL) => url.pathname === "/api/pubs";
const PUB_DETAIL_API = (url: URL) => url.pathname === "/api/pubs/42";
const AUTH_ME_API = (url: URL) => url.pathname === "/api/auth/me";
const COUNTRIES_API = (url: URL) => url.pathname === "/api/countries";
const BEER_TYPES_API = (url: URL) => url.pathname === "/api/beer-types";

const otherPubs = [
  { id: "1", name: "The Harp", city: "London", address: "47 Chandos Place", country: "GB" },
  { id: "3", name: "The Eagle", city: "Cambridge", address: "8 Bene't Street", country: "GB" },
];

const fakePub = {
  id: "42",
  name: "The Anchor",
  city: "Bristol",
  address: "5 King Street",
  postcode: "BS1 4EF",
  country: "GB",
  createdAt: "2024-01-15T10:00:00.000Z",
};

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

test.describe("Search results -> open pub -> edit -> list reflects update", () => {
  test("editing a pub found via search updates its name in the list afterwards", async ({
    page,
  }) => {
    // Mutable store so the list route can reflect the later PATCH.
    let currentPubName = fakePub.name;

    await page.route(AUTH_ME_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ email: "editor@example.com", approved: true, admin: false }),
      })
    );
    await silenceSecondaryAPIs(page);

    await page.route(PUBS_LIST_API, (route, request) => {
      const url = new URL(request.url());
      const search = (url.searchParams.get("search") ?? "").toLowerCase();
      const allPubs = [{ ...fakePub, name: currentPubName }, ...otherPubs];
      const filtered = search
        ? allPubs.filter(
            (p) =>
              p.name.toLowerCase().includes(search) ||
              p.city.toLowerCase().includes(search) ||
              p.address.toLowerCase().includes(search),
          )
        : allPubs;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: filtered }),
      });
    });

    await page.route(PUB_DETAIL_API, (route) => {
      if (route.request().method() === "PATCH") {
        currentPubName = "The Crown";
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...fakePub, name: currentPubName }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...fakePub, name: currentPubName }),
      });
    });

    // Search for the pub.
    await page.goto("/pubs");
    await page.getByRole("link", { name: "The Harp" }).waitFor();
    await page.getByRole("searchbox", { name: "Search pubs" }).fill("Anchor");
    await expect(page.getByRole("link", { name: "The Anchor" })).toBeVisible();
    await expect(page.getByRole("link", { name: "The Harp" })).not.toBeVisible();

    // Open it from the search results.
    await page.getByRole("link", { name: "The Anchor" }).click();
    await expect(page).toHaveURL("/pubs/42");
    await page.getByRole("heading", { name: "The Anchor" }).first().waitFor();

    // Edit and save the name.
    await page.getByRole("button", { name: "Edit this pub" }).click();
    await page.getByRole("button", { name: "Save" }).first().waitFor();
    await page.locator("#edit-name").fill("The Crown");
    await page.getByRole("button", { name: "Save" }).first().click();
    await expect(page.getByRole("heading", { name: "The Crown" }).first()).toBeVisible();

    // Back to the list: the updated name should now appear instead of the old one.
    await page.getByRole("link", { name: "Pubs", exact: true }).click();
    await expect(page).toHaveURL("/pubs");
    await expect(page.getByRole("link", { name: "The Crown" })).toBeVisible();
    await expect(page.getByRole("link", { name: "The Anchor" })).not.toBeVisible();
  });
});
