import { expect, test } from "@playwright/test";

const PUBS_API = (url: URL) => url.href.includes("/pubs?limit=");

const fakePubs = [
  { id: "1", name: "The Harp", city: "London", address: "47 Chandos Place", country: "GB" },
  { id: "2", name: "The Crown", city: "Brighton", address: "1 High Street", country: "GB" },
  { id: "3", name: "The Eagle", city: "Cambridge", address: "8 Bene't Street", country: "GB" },
];

function pubsResponse(pubs = fakePubs, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify({ data: pubs }),
  };
}

test.describe("Pubs list (/pubs)", () => {
  test("shows loading state before fetch resolves", async ({ page }) => {
    await page.route(PUBS_API, () => {}); // never resolves
    await page.goto("/pubs");
    await expect(page.getByText("Loading pubs…")).toBeVisible();
  });

  test("renders pub names with links after successful fetch", async ({ page }) => {
    await page.route(PUBS_API, (route) => route.fulfill(pubsResponse()));
    await page.goto("/pubs");

    await expect(page.getByRole("link", { name: "The Harp" })).toBeVisible();
    await expect(page.getByRole("link", { name: "The Crown" })).toBeVisible();
    await expect(page.getByRole("link", { name: "The Eagle" })).toBeVisible();
  });

  test("each pub link points to its detail page", async ({ page }) => {
    await page.route(PUBS_API, (route) => route.fulfill(pubsResponse()));
    await page.goto("/pubs");

    await expect(page.getByRole("link", { name: "The Harp" })).toHaveAttribute(
      "href",
      "/pubs/1"
    );
  });

  test("shows city alongside each pub name", async ({ page }) => {
    await page.route(PUBS_API, (route) => route.fulfill(pubsResponse()));
    await page.goto("/pubs");

    await expect(page.getByText(/The Harp/)).toBeVisible();
    await expect(page.getByText(/London/)).toBeVisible();
  });

  test("shows empty state when no pubs are returned", async ({ page }) => {
    await page.route(PUBS_API, (route) => route.fulfill(pubsResponse([])));
    await page.goto("/pubs");

    await expect(page.getByText("No pubs found.")).toBeVisible();
  });

  test("shows error message on API failure", async ({ page }) => {
    await page.route(PUBS_API, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      })
    );
    await page.goto("/pubs");

    await expect(page.getByText(/Error loading pubs/)).toBeVisible();
    await expect(page.getByText("Internal server error")).toBeVisible();
  });

  test("shows Try Again button on error", async ({ page }) => {
    await page.route(PUBS_API, (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: "{}" })
    );
    await page.goto("/pubs");

    await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
  });

  test("shows Add Pub link when pubs are loaded", async ({ page }) => {
    await page.route(PUBS_API, (route) => route.fulfill(pubsResponse()));
    await page.goto("/pubs");

    await expect(page.locator("#main-content").getByRole("link", { name: /add pub/i })).toBeVisible();
  });

  test.describe("search", () => {
    test.beforeEach(async ({ page }) => {
      await page.route(PUBS_API, (route, request) => {
        const url = new URL(request.url());
        const search = (url.searchParams.get("search") ?? "").toLowerCase();
        const filtered = search
          ? fakePubs.filter(
              (p) =>
                p.name.toLowerCase().includes(search) ||
                p.city.toLowerCase().includes(search) ||
                p.address.toLowerCase().includes(search),
            )
          : fakePubs;
        return route.fulfill(pubsResponse(filtered));
      });
      await page.goto("/pubs");
      await page.getByRole("link", { name: "The Harp" }).waitFor();
    });

    test("filters pubs by name", async ({ page }) => {
      await page.getByRole("searchbox", { name: "Search pubs" }).fill("Harp");

      await expect(page.getByRole("link", { name: "The Harp" })).toBeVisible();
      await expect(page.getByRole("link", { name: "The Crown" })).not.toBeVisible();
      await expect(page.getByRole("link", { name: "The Eagle" })).not.toBeVisible();
    });

    test("filters pubs by city", async ({ page }) => {
      await page.getByRole("searchbox", { name: "Search pubs" }).fill("Brighton");

      await expect(page.getByRole("link", { name: "The Crown" })).toBeVisible();
      await expect(page.getByRole("link", { name: "The Harp" })).not.toBeVisible();
    });

    test("filters pubs by address", async ({ page }) => {
      await page.getByRole("searchbox", { name: "Search pubs" }).fill("Bene't");

      await expect(page.getByRole("link", { name: "The Eagle" })).toBeVisible();
      await expect(page.getByRole("link", { name: "The Harp" })).not.toBeVisible();
    });

  });
});
