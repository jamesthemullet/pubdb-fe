import { expect, test } from "@playwright/test";
import { mockDashboardEndpoint } from "../fixtures/auth";

test.describe("Sidebar navigation", () => {
  test("Browse pubs link navigates to /pubs", async ({ page }) => {
    await page.route("**/pubs**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      })
    );
    await page.goto("/");
    await page.locator("aside").getByRole("link", { name: "Browse pubs" }).click();
    await expect(page).toHaveURL("/pubs");
  });

  test("Register link navigates to /register", async ({ page }) => {
    await page.goto("/");
    await page.locator("aside").getByRole("link", { name: /register/i }).click();
    await expect(page).toHaveURL("/register");
  });

  test("Logout redirects to home and shows Register link", async ({ page }) => {
    // Auth is now determined by /api/auth/me on every check (there's no
    // client-readable token to short-circuit on), so the mock needs to
    // track logout state itself: authenticated until /api/auth/logout is
    // called, then unauthenticated for the follow-up /api/auth/me check
    // that useAuth() fires in response to the "authChanged" event.
    let loggedIn = true;
    await page.route("**/auth/me", (route) =>
      route.fulfill({
        status: loggedIn ? 200 : 401,
        contentType: "application/json",
        body: loggedIn ? JSON.stringify({ email: "tester@example.com", approved: true }) : "{}",
      })
    );
    await page.route("**/api/auth/logout", (route) => {
      loggedIn = false;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    await mockDashboardEndpoint(page);
    await page.goto("/");
    await page.locator("aside").getByRole("button", { name: "Log out" }).click();
    await expect(page.locator("aside").getByRole("link", { name: /register/i })).toBeVisible();
  });
});
