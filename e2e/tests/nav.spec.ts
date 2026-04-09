import { expect, test } from "@playwright/test";
import { mockDashboardEndpoint, setAuthToken } from "../fixtures/auth";

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
    await mockDashboardEndpoint(page);
    await setAuthToken(page, "tester@example.com");
    await page.goto("/");
    await page.locator("nav").getByRole("button", { name: "Logout" }).click();
    await expect(page.locator("nav").getByRole("link", { name: "Register" })).toBeVisible();
  });
});
