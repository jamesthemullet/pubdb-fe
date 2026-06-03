import { expect, test } from "@playwright/test";
import { makeFakeJwt } from "../fixtures/auth";

const AUTH_ME_API = (url: URL) => url.port === "4000" && url.pathname === "/auth/me";
const ADD_PUB_API = (url: URL) => url.port === "4000" && url.pathname === "/pubs";
const COUNTRIES_API = (url: URL) => url.href.includes("restcountries.com");

function jsonResponse(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

function mockCountries(page: import("@playwright/test").Page) {
  return page.route(COUNTRIES_API, (route) =>
    route.fulfill(jsonResponse([{ name: { common: "United Kingdom" }, cca2: "GB" }]))
  );
}

async function setApprovedUser(page: import("@playwright/test").Page) {
  const token = makeFakeJwt("editor@example.com");
  await page.addInitScript((t) => {
    localStorage.setItem("token", t);
  }, token);
  await page.route(AUTH_ME_API, (route) =>
    route.fulfill(jsonResponse({ email: "editor@example.com", approved: true }))
  );
}

async function fillRequiredFields(page: import("@playwright/test").Page) {
  await page.getByPlaceholder(/crown.*anchor|the crown/i).fill("The Red Lion");
  await page.getByPlaceholder(/e\.g\. london/i).fill("Manchester");
  await page.locator("#country").selectOption("GB");
  await page.getByPlaceholder(/dean street/i).fill("10 Deansgate");
  await page.getByPlaceholder(/W1D 4PX/i).fill("M3 2GQ");
}

test.describe("Add Pub (/add-pub)", () => {
  test("shows login prompt for unauthenticated visitors", async ({ page }) => {
    await mockCountries(page);
    await page.goto("/add-pub");
    // Unauthenticated state shows the AuthGate sign-in form
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  });

  test("shows approval prompt for unapproved users", async ({ page }) => {
    const token = makeFakeJwt("pending@example.com");
    await page.addInitScript((t) => {
      localStorage.setItem("token", t);
    }, token);
    await page.route(AUTH_ME_API, (route) =>
      route.fulfill(jsonResponse({ email: "pending@example.com", approved: false }))
    );
    await mockCountries(page);
    await page.goto("/add-pub");
    await expect(page.getByText(/Your account isn't approved for editing yet/)).toBeVisible();
  });

  test.describe("with an approved user", () => {
    test.beforeEach(async ({ page }) => {
      await setApprovedUser(page);
      await mockCountries(page);
      await page.goto("/add-pub");
      await page.getByRole("button", { name: /submit pub/i }).first().waitFor();
    });

    test("renders the form with required fields and submit button", async ({ page }) => {
      await expect(page.getByLabel(/pub name/i)).toBeVisible();
      await expect(page.getByLabel(/^city/i)).toBeVisible();
      await expect(page.getByLabel(/street address/i)).toBeVisible();
      await expect(page.getByLabel(/postcode/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /submit pub/i }).first()).toBeVisible();
    });

    test("shows success message after successful submission", async ({ page }) => {
      await page.route(ADD_PUB_API, (route) =>
        route.fulfill(jsonResponse({ id: "99", name: "The Red Lion" }))
      );

      await fillRequiredFields(page);
      await page.getByRole("button", { name: /submit pub/i }).first().click();

      await expect(page.getByText("Pub submitted for review!")).toBeVisible();
    });

    test("shows duplicate pub error message on 409", async ({ page }) => {
      await page.route(ADD_PUB_API, (route) =>
        route.fulfill(jsonResponse({ id: "55", error: "Pub already exists" }, 409))
      );

      await fillRequiredFields(page);
      await page.getByRole("button", { name: /submit pub/i }).first().click();

      await expect(page.getByText("Pub already exists")).toBeVisible();
    });

    test("shows API validation error on failure", async ({ page }) => {
      await page.route(ADD_PUB_API, (route) =>
        route.fulfill(jsonResponse({ error: "Name is too long" }, 400))
      );

      await fillRequiredFields(page);
      await page.getByRole("button", { name: /submit pub/i }).first().click();

      await expect(page.getByText("Name is too long")).toBeVisible();
    });

    test("shows network error when request fails", async ({ page }) => {
      await page.route(ADD_PUB_API, (route) => route.abort());

      await fillRequiredFields(page);
      await page.getByRole("button", { name: /submit pub/i }).first().click();

      await expect(page.getByText("Network error")).toBeVisible();
    });
  });
});
