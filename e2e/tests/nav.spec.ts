import { expect, test } from "@playwright/test";
import { setAuthToken } from "../fixtures/auth";

test.describe("NavBar navigation", () => {
  test("All Pubs link navigates to /pubs", async ({ page }) => {
    await page.route("**/pubs**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      })
    );
    await page.goto("/");
    await page.locator("nav").getByRole("link", { name: "All Pubs" }).click();
    await expect(page).toHaveURL("/pubs");
  });

  test("Register link navigates to /register", async ({ page }) => {
    await page.goto("/");
    await page.locator("nav").getByRole("link", { name: "Register" }).click();
    await expect(page).toHaveURL("/register");
  });

  test("Logout redirects to home and shows Register link", async ({ page }) => {
    await setAuthToken(page, "tester@example.com");
    let isLoggedOut = false;
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: isLoggedOut ? 401 : 200,
        contentType: "application/json",
        body: JSON.stringify(
          isLoggedOut ? { error: "Unauthorized" } : { email: "tester@example.com" }
        ),
      })
    );
    await page.route("**/api/auth/logout", (route) => {
      isLoggedOut = true;
      route.continue();
    });
    await page.goto("/");
    await page.locator("nav").getByRole("button", { name: "Logout" }).click();
    await expect(page.locator("nav").getByRole("link", { name: "Register" })).toBeVisible();
  });
});
