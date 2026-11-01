import { expect, test } from "@playwright/test";

// The detail page fetches from the Next.js proxy routes /api/pubs/77 and the
// secondary country/beer-type lookups (port 3000), same pattern as pub-detail.spec.ts.
const PUB_API = (url: URL) => url.pathname === "/api/pubs/77";
const COUNTRIES_API = (url: URL) => url.pathname === "/api/countries";
const BEER_TYPES_API = (url: URL) => url.pathname === "/api/beer-types";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function todayFull(): string {
  const jsDayIndex = new Date().getDay();
  return WEEKDAYS[jsDayIndex === 0 ? 6 : jsDayIndex - 1];
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

function pubWithHours(openingHours: Record<string, unknown>) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      id: "77",
      name: "The Open Arms",
      city: "York",
      address: "1 Market Street",
      postcode: "YO1 1AA",
      country: "GB",
      createdAt: "2024-01-15T10:00:00.000Z",
      openingHours,
    }),
  };
}

test.describe("Pub detail Hours tab (/pubs/[id])", () => {
  test("shows each day's hours, marks today's row, and shows the open-now badge when today is open all day", async ({
    page,
  }) => {
    const today = todayFull();
    const openingHours: Record<string, { open?: string; close?: string; closed?: boolean }> = {};
    for (const day of WEEKDAYS) {
      openingHours[day] =
        day === today
          ? { open: "00:00", close: "23:59" }
          : { closed: true };
    }

    await page.route(PUB_API, (route) => route.fulfill(pubWithHours(openingHours)));
    await silenceSecondaryAPIs(page);
    await page.goto("/pubs/77");
    await page.getByRole("heading", { name: "The Open Arms" }).first().waitFor();

    await page.getByRole("tab", { name: "Hours" }).click();

    await expect(page.getByText("Open now")).toBeVisible();
    await expect(page.getByText("· today")).toBeVisible();

    const todayRow = page.locator('[class*="hoursRowToday"]');
    await expect(todayRow).toContainText("00:00");
    await expect(todayRow).toContainText("23:59");

    const closedRows = page.locator('[class*="hoursClosed"]');
    expect(await closedRows.count()).toBe(6);
    await expect(closedRows.first()).toHaveText("Closed");
  });

  test("shows 'No opening hours recorded' when the pub has no opening hours", async ({
    page,
  }) => {
    await page.route(PUB_API, (route) =>
      route.fulfill(pubWithHours(undefined as unknown as Record<string, unknown>))
    );
    await silenceSecondaryAPIs(page);
    await page.goto("/pubs/77");
    await page.getByRole("heading", { name: "The Open Arms" }).first().waitFor();

    await page.getByRole("tab", { name: "Hours" }).click();

    await expect(page.getByText("No opening hours recorded.")).toBeVisible();
  });
});
