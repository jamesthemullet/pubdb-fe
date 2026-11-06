import { expect, test } from "@playwright/test";

const AUTH_ME_API = "**/auth/me";
const DASHBOARD_API = "**/auth/dashboard";
const BILLING_API = "**/payments/billing";
const UPGRADE_ESTIMATE_API = "**/payments/upgrade-estimate";
const CHECKOUT_SESSION_API = "**/payments/create-checkout-session";
const MOCK_CHECKOUT_HOST = "mock-stripe-checkout.test";
const MOCK_CHECKOUT_URL = `https://${MOCK_CHECKOUT_HOST}/session/cs_test_123`;

function mockAuthenticated(page: import("@playwright/test").Page) {
  return page.route(AUTH_ME_API, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ email: "test@example.com", approved: true }),
    })
  );
}

function dashboardResponse(tier: string) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      apiKeys: [
        {
          name: "My Key",
          tier,
          isActive: true,
          usageCount: 10,
        },
      ],
      subscription: {
        tier,
        limits: {
          requestsPerHour: 20,
          requestsPerDay: 200,
          requestsPerMonth: 1000,
        },
        remaining: { hour: 15, day: 150, month: 800 },
        resetTimes: {
          hour: new Date(Date.now() + 30 * 60000).toISOString(),
          day: "2026-07-05T00:00:00.000Z",
          month: "2026-08-01T00:00:00.000Z",
        },
      },
      user: { name: "Test User", email: "test@example.com" },
      summary: { totalApiKeys: 1, totalUsage: 10 },
    }),
  };
}

function billingResponse(tier: string) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      plan: { tier, price: null, currency: null, interval: null },
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      stripeCustomerId: null,
      billingDetails: null,
      paymentMethod: null,
      upcomingInvoice: null,
      invoices: [],
    }),
  };
}

test.describe("Billing page (/billing)", () => {
  test("shows the current plan and the available pricing tiers", async ({
    page,
  }) => {
    await mockAuthenticated(page);
    await page.route(DASHBOARD_API, (route) =>
      route.fulfill(dashboardResponse("HOBBY"))
    );
    await page.route(BILLING_API, (route) =>
      route.fulfill(billingResponse("HOBBY"))
    );

    await page.goto("/billing");

    await expect(page.getByRole("heading", { name: "Hobby" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "DEVELOPER" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "BUSINESS" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Upgrade to developer" })
    ).toBeVisible();
  });

  test("initiates Stripe checkout when upgrading to a paid tier", async ({
    page,
  }) => {
    await mockAuthenticated(page);
    await page.route(DASHBOARD_API, (route) =>
      route.fulfill(dashboardResponse("HOBBY"))
    );
    await page.route(BILLING_API, (route) =>
      route.fulfill(billingResponse("HOBBY"))
    );
    await page.route(UPGRADE_ESTIMATE_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ needsCheckout: true }),
      })
    );
    await page.route(CHECKOUT_SESSION_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: MOCK_CHECKOUT_URL }),
      })
    );
    await page.route(`**/${MOCK_CHECKOUT_HOST}/**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>Mock Stripe Checkout</body></html>",
      })
    );

    await page.goto("/billing");
    await page
      .getByRole("button", { name: "Upgrade to developer" })
      .click();

    await page.waitForURL(MOCK_CHECKOUT_URL);
    await expect(page.getByText("Mock Stripe Checkout")).toBeVisible();
  });
});
