import { expect, test } from "@playwright/test";
import { makeFakeJwt } from "../fixtures/auth";

const AUTH_ME_API = "**/api/auth/me";
const ADD_PUB_API = "**/api/pubs";
const COUNTRIES_API = (url: URL) => url.href.includes("restcountries.com");

function jsonResponse(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

function mockCountries(page: import("@playwright/test").Page) {
  // Provide at least one country so the required <select> can be filled in tests
  return page.route(COUNTRIES_API, (route) =>
    route.fulfill(jsonResponse([{ name: { common: "United Kingdom" }, cca2: "GB" }]))
  );
}

async function setApprovedUser(page: import("@playwright/test").Page) {
  const token = makeFakeJwt("editor@example.com");
  await page.context().addCookies([{
    name: "auth-token",
    value: token,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "Strict",
  }]);
  await page.route(AUTH_ME_API, (route) =>
    route.fulfill(jsonResponse({ email: "editor@example.com", approved: true }))
  );
}

async function fillRequiredFields(page: import("@playwright/test").Page) {
  await page.getByPlaceholder("Enter pub name").fill("The Red Lion");
  await page.getByPlaceholder("Enter city").fill("Manchester");
  await page.locator("#country").selectOption("GB");
  await page.getByPlaceholder("Enter address").fill("10 Deansgate");
  await page.getByPlaceholder("Enter postcode").fill("M3 2GQ");
}

test.describe("Add Pub (/add-pub)", () => {
  test("shows login prompt for unauthenticated visitors", async ({ page }) => {
    await mockCountries(page);
    await page.goto("/add-pub");
    await expect(page.getByText("You must be logged in to add a pub.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Register or Login" })).toBeVisible();
  });

  test("shows approval prompt for unapproved users", async ({ page }) => {
    const token = makeFakeJwt("pending@example.com");
    await page.context().addCookies([{
      name: "auth-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    }]);
    await page.route(AUTH_ME_API, (route) =>
      route.fulfill(jsonResponse({ email: "pending@example.com", approved: false }))
    );
    await mockCountries(page);
    await page.goto("/add-pub");
    await expect(page.getByText(/Your account is not approved for editing/)).toBeVisible();
  });

  test.describe("with an approved user", () => {
    test.beforeEach(async ({ page }) => {
      await setApprovedUser(page);
      await mockCountries(page);
      await page.goto("/add-pub");
      await page.getByRole("button", { name: "Add Pub" }).waitFor();
    });

    test("renders the form with required fields and submit button", async ({ page }) => {
      await expect(page.getByPlaceholder("Enter pub name")).toBeVisible();
      await expect(page.getByPlaceholder("Enter city")).toBeVisible();
      await expect(page.getByPlaceholder("Enter address")).toBeVisible();
      await expect(page.getByPlaceholder("Enter postcode")).toBeVisible();
      await expect(page.getByRole("button", { name: "Add Pub" })).toBeVisible();
    });

    test("shows success message after successful submission", async ({ page }) => {
      await page.route(ADD_PUB_API, (route) =>
        route.fulfill(jsonResponse({ id: "99", name: "The Red Lion" }))
      );

      await fillRequiredFields(page);
      await page.getByRole("button", { name: "Add Pub" }).click();

      await expect(page.getByText("Pub added successfully!")).toBeVisible();
    });

    test("shows duplicate pub message with edit link on 409", async ({ page }) => {
      await page.route(ADD_PUB_API, (route) =>
        route.fulfill(jsonResponse({ id: "55", error: "Pub already exists" }, 409))
      );

      await fillRequiredFields(page);
      await page.getByRole("button", { name: "Add Pub" }).click();

      await expect(page.getByText("A matching pub already exists.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Open existing pub to edit" })).toBeVisible();
    });

    test("shows API validation error on failure", async ({ page }) => {
      await page.route(ADD_PUB_API, (route) =>
        route.fulfill(jsonResponse({ error: "Name is too long" }, 400))
      );

      await fillRequiredFields(page);
      await page.getByRole("button", { name: "Add Pub" }).click();

      await expect(page.getByText("Name is too long")).toBeVisible();
    });

    test("shows network error when request fails", async ({ page }) => {
      await page.route(ADD_PUB_API, (route) => route.abort());

      await fillRequiredFields(page);
      await page.getByRole("button", { name: "Add Pub" }).click();

      await expect(page.getByText("Network error")).toBeVisible();
    });
  });
});
