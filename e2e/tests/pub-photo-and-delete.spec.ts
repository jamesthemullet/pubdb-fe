import { expect, test } from "@playwright/test";

const PUB_API = (url: URL) => url.pathname === "/api/pubs/42";
const PUB_IMAGE_API = (url: URL) => url.pathname === "/api/pubs/42/image";
const PUBS_LIST_API = (url: URL) => url.pathname === "/api/pubs";
const AUTH_ME_API = (url: URL) => url.pathname === "/api/auth/me";
const COUNTRIES_API = (url: URL) => url.pathname === "/api/countries";
const BEER_TYPES_API = (url: URL) => url.pathname === "/api/beer-types";

// A 1x1 transparent PNG, well under the 8MB client-side size limit.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAAAXNSR0IArs4c6QAAAAtJREFUGFdj+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const fakePub = {
  id: "42",
  name: "The Anchor",
  city: "Bristol",
  address: "5 King Street",
  postcode: "BS1 4EF",
  country: "GB",
  createdAt: "2024-01-15T10:00:00.000Z",
};

function authResponse(admin: boolean) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ email: "editor@example.com", approved: true, admin }),
  };
}

function silenceSecondaryAPIs(page: import("@playwright/test").Page) {
  return Promise.all([
    page.route(COUNTRIES_API, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    ),
    page.route(BEER_TYPES_API, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    ),
  ]);
}

test.describe("Pub photo upload (/pubs/[id])", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(AUTH_ME_API, (route) => route.fulfill(authResponse(false)));
    await page.route(PUB_API, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fakePub) }),
    );
    await silenceSecondaryAPIs(page);
    await page.goto("/pubs/42");
    await page.getByRole("heading", { name: "The Anchor" }).first().waitFor();
  });

  test("uploading a photo POSTs the image and shows it on the page", async ({ page }) => {
    await page.route(PUB_IMAGE_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...fakePub, imageUrl: "https://cdn.example.com/anchor.png" }),
      }),
    );

    await expect(page.getByText("Upload photo")).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles({
      name: "anchor.png",
      mimeType: "image/png",
      buffer: TINY_PNG,
    });

    await expect(page.getByAltText("The Anchor")).toBeVisible();
    await expect(page.getByText("Change photo")).toBeVisible();
  });

  test("shows the API's error message when the upload fails", async ({ page }) => {
    await page.route(PUB_IMAGE_API, (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Only image files are allowed." }),
      }),
    );

    await page.locator('input[type="file"]').setInputFiles({
      name: "anchor.png",
      mimeType: "image/png",
      buffer: TINY_PNG,
    });

    await expect(
      page.getByRole("alert").filter({ hasText: "Only image files are allowed." }),
    ).toBeVisible();
  });

  test("rejects a file over 8MB client-side without calling the API", async ({ page }) => {
    let uploadCalled = false;
    await page.route(PUB_IMAGE_API, (route) => {
      uploadCalled = true;
      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.locator('input[type="file"]').setInputFiles({
      name: "huge.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(9 * 1024 * 1024),
    });

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Image is too large — please choose a file under 8MB." }),
    ).toBeVisible();
    expect(uploadCalled).toBe(false);
  });
});

test.describe("Pub delete (/pubs/[id])", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(AUTH_ME_API, (route) => route.fulfill(authResponse(true)));
    await page.route(PUB_API, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fakePub) }),
    );
    await page.route(PUBS_LIST_API, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await silenceSecondaryAPIs(page);
    await page.goto("/pubs/42");
    await page.getByRole("heading", { name: "The Anchor" }).first().waitFor();
  });

  test("confirming the dialog DELETEs the pub and redirects to /pubs", async ({ page }) => {
    await page.route(PUB_API, (route) => {
      if (route.request().method() === "DELETE") {
        return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fakePub) });
    });
    page.once("dialog", (dialog) => dialog.accept());

    await page.getByRole("button", { name: "Delete this pub" }).click();

    await expect(page).toHaveURL("/pubs");
  });

  test("dismissing the dialog does not delete the pub", async ({ page }) => {
    let deleteCalled = false;
    await page.route(PUB_API, (route) => {
      if (route.request().method() === "DELETE") {
        deleteCalled = true;
        return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fakePub) });
    });
    page.once("dialog", (dialog) => dialog.dismiss());

    await page.getByRole("button", { name: "Delete this pub" }).click();

    await expect(page).toHaveURL("/pubs/42");
    expect(deleteCalled).toBe(false);
  });
});
