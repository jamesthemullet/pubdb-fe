import { expect, test } from "@playwright/test";

const VERIFY_API = (url: URL) =>
  url.port === "4000" && url.pathname === "/payments/verify-session";

function verifyResponse(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

const successfulVerification = {
  success: true,
  message: "Your subscription is now active.",
  subscription: {
    subscriptionId: "sub_test_123",
    status: "ACTIVE",
    tier: "PRO",
    billingDay: 15,
  },
  apiKey: { key: "sk_live_abc123", keyPrefix: "sk_live" },
};

test.describe("Payment success page (/success)", () => {
  test("shows error when no session_id is provided", async ({ page }) => {
    await page.goto("/success");
    await expect(page.getByText("No session ID provided")).toBeVisible();
    await expect(page.getByRole("button", { name: "Return to Home" })).toBeVisible();
  });

  test("shows loading state before API responds", async ({ page }) => {
    await page.route(VERIFY_API, () => {}); // never resolves
    await page.goto("/success?session_id=cs_test_abc");
    await expect(page.getByText("Verifying your subscription...")).toBeVisible();
  });

  test("shows success details after verified payment", async ({ page }) => {
    await page.route(VERIFY_API, (route) =>
      route.fulfill(verifyResponse(successfulVerification))
    );
    await page.goto("/success?session_id=cs_test_abc");

    await expect(page.getByText("Subscription Successful!")).toBeVisible();
    await expect(page.getByText("Your subscription is now active.")).toBeVisible();
    await expect(page.getByText(/PRO/)).toBeVisible();
    await expect(page.getByText(/15th/)).toBeVisible();
    await expect(page.getByRole("button", { name: "View Dashboard" })).toBeVisible();
  });

  test("shows failure state when success is false", async ({ page }) => {
    await page.route(VERIFY_API, (route) =>
      route.fulfill(
        verifyResponse({ success: false, message: "Payment was declined." })
      )
    );
    await page.goto("/success?session_id=cs_test_abc");

    await expect(page.getByText("Subscription Failed")).toBeVisible();
    await expect(page.getByText("Payment was declined.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Try Again" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Contact Support" })).toBeVisible();
  });

  test("shows verification failed when API returns an error", async ({ page }) => {
    await page.route(VERIFY_API, (route) =>
      route.fulfill(verifyResponse({ error: "Session expired" }, 400))
    );
    await page.goto("/success?session_id=cs_test_abc");

    await expect(page.getByText("Verification Failed")).toBeVisible();
    await expect(page.getByText("Session expired")).toBeVisible();
    await expect(page.getByRole("button", { name: "Return to Home" })).toBeVisible();
  });
});
