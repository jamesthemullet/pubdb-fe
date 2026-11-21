import { expect, test } from "@playwright/test";

const AUTH_ME_API = "**/auth/me";
const PASSWORD_API = "**/auth/me/password";
const LOGOUT_API = "**/auth/logout";

function mockAuthenticated(page: import("@playwright/test").Page) {
  return page.route(AUTH_ME_API, (route) => {
    if (route.request().method() !== "GET") {
      route.fallback();
      return;
    }
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        email: "test@example.com",
        approved: true,
        name: "Test User",
        username: "testuser",
      }),
    });
  });
}

test.describe("Settings page (/settings)", () => {
  test("shows sign-in form when unauthenticated", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  });

  test.describe("when authenticated", () => {
    test.beforeEach(async ({ page }) => {
      await mockAuthenticated(page);
      await page.goto("/settings");
      await page.getByLabel("Display name").waitFor();
    });

    test("updates the profile and shows a saved confirmation", async ({ page }) => {
      await page.route(AUTH_ME_API, (route) => {
        if (route.request().method() !== "PATCH") {
          route.fallback();
          return;
        }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ email: "test@example.com", approved: true, name: "New Name" }),
        });
      });

      await page.getByLabel("Display name").fill("New Name");
      await page.getByRole("button", { name: "Save changes" }).click();

      await expect(page.getByText("Changes saved.")).toBeVisible();
    });

    test("shows an error when the current password is wrong", async ({ page }) => {
      await page.getByRole("button", { name: "Security" }).click();

      await page.route(PASSWORD_API, (route) =>
        route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Invalid credentials" }),
        })
      );

      await page.getByLabel("Current password").fill("wrong-password");
      await page.getByLabel("New password", { exact: true }).fill("new-password-123");
      await page.getByLabel("Confirm new password").fill("new-password-123");
      await page.getByRole("button", { name: "Save changes" }).click();

      await expect(page.getByText("Current password is incorrect.")).toBeVisible();
    });

    test("deletes the account with a confirmed password and redirects home", async ({ page }) => {
      await page.getByRole("button", { name: "Danger zone" }).click();
      await page.getByRole("button", { name: "Delete account" }).click();

      await page.route(AUTH_ME_API, (route) => {
        if (route.request().method() !== "DELETE") {
          route.fallback();
          return;
        }
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      });
      await page.route(LOGOUT_API, (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        })
      );

      await page.getByLabel("Confirm password").fill("current-password");
      await page.getByRole("button", { name: "Confirm delete" }).click();

      await page.waitForURL("/");
    });
  });
});
