import type { Page } from "@playwright/test";

/**
 * Mock the /api/auth/me endpoint the useAuth hook calls on every page to
 * determine the current session. Auth state is now backed by a
 * server-set httpOnly cookie the client can't read or seed directly, so
 * mocking this endpoint is the only way to simulate being logged in.
 */
export async function mockAuthMeEndpoint(
  page: Page,
  email: string,
  { approved = true }: { approved?: boolean } = {}
): Promise<void> {
  await page.route("**/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ email, approved }),
    })
  );
}

/**
 * Mock the backend dashboard endpoint so pages that call it when
 * authenticated don't get a network error.
 */
export async function mockDashboardEndpoint(
  page: Page,
  tier = "HOBBY"
): Promise<void> {
  await page.route("**/auth/dashboard", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        apiKeys: [{ tier }],
        user: { name: "Test User", email: "test@example.com", approved: true, emailVerified: true },
        summary: { totalApiKeys: 1, totalUsage: 0 },
      }),
    })
  );
}
