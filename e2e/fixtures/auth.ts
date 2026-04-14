import type { Page } from "@playwright/test";

/**
 * Build a minimal fake JWT whose payload contains the given email.
 * The signature is not valid — that's fine because the NavBar only
 * base64-decodes the payload; it never validates the signature.
 */
export function makeFakeJwt(email: string): string {
  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ email, sub: "test-user-id", iat: Math.floor(Date.now() / 1000) });
  return `${header}.${payload}.fakesignature`;
}

/**
 * Seed the auth-token httpOnly cookie before the page navigates.
 * Call this before page.goto() so the cookie is present on the first request.
 */
export async function setAuthToken(page: Page, email: string): Promise<void> {
  const token = makeFakeJwt(email);
  await page.context().addCookies([
    {
      name: "auth-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Strict",
    },
  ]);
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
