import { expect, test } from "@playwright/test";

function jsonResponse(body: unknown, status = 200) {
	return {
		status,
		contentType: "application/json",
		body: JSON.stringify(body),
	};
}

test.describe("Reset Password page", () => {
	test.describe("without a token", () => {
		test("shows an invalid link message", async ({ page }) => {
			await page.goto("/reset-password");
			await expect(
				page.getByRole("heading", { name: "Invalid Reset Link" }),
			).toBeVisible();
		});

		test("shows a link to request a new reset", async ({ page }) => {
			await page.goto("/reset-password");
			await expect(
				page.getByRole("link", { name: "Request a new password reset" }),
			).toHaveAttribute("href", "/forgot-password");
		});
	});

	test.describe("with a valid token", () => {
		test.beforeEach(async ({ page }) => {
			await page.goto("/reset-password?token=test-token-123");
		});

		test("renders New Password and Confirm Password fields", async ({
			page,
		}) => {
			await expect(page.getByLabel("New Password:")).toBeVisible();
			await expect(page.getByLabel("Confirm Password:")).toBeVisible();
			await expect(
				page.getByRole("button", { name: "Reset Password" }),
			).toBeVisible();
		});

		test("shows error when passwords do not match", async ({ page }) => {
			await page.getByLabel("New Password:").fill("password123");
			await page.getByLabel("Confirm Password:").fill("different123");
			await page.getByRole("button", { name: "Reset Password" }).click();

			await expect(page.getByText("Passwords do not match")).toBeVisible();
		});

		test("shows error when password is too short", async ({ page }) => {
			// The inputs carry minLength={6} which triggers native browser validation
			// before the JS check runs. Strip it so we can test the JS code path.
			await page.evaluate(() => {
				document
					.querySelectorAll("input[type='password']")
					.forEach((el) => { el.removeAttribute("minlength"); });
			});

			await page.getByLabel("New Password:").fill("abc");
			await page.getByLabel("Confirm Password:").fill("abc");
			await page.getByRole("button", { name: "Reset Password" }).click();

			await expect(
				page.getByText("Password must be at least 6 characters"),
			).toBeVisible();
		});

		test("shows success message and Go to Login link on success", async ({
			page,
		}) => {
			await page.route("**/auth/reset-password", (route) =>
				route.fulfill(jsonResponse({ message: "Password reset successfully" })),
			);

			await page.getByLabel("New Password:").fill("newpassword123");
			await page.getByLabel("Confirm Password:").fill("newpassword123");
			await page.getByRole("button", { name: "Reset Password" }).click();

			await expect(page.getByText("Password reset successfully")).toBeVisible();
			await expect(
				page.getByRole("link", { name: "Go to Login" }),
			).toBeVisible();
		});

		test("shows API error on failure", async ({ page }) => {
			await page.route("**/auth/reset-password", (route) =>
				route.fulfill(jsonResponse({ error: "Token expired" }, 400)),
			);

			await page.getByLabel("New Password:").fill("newpassword123");
			await page.getByLabel("Confirm Password:").fill("newpassword123");
			await page.getByRole("button", { name: "Reset Password" }).click();

			await expect(page.getByText("Token expired")).toBeVisible();
		});

		test("shows network error message when request fails", async ({ page }) => {
			await page.route("**/auth/reset-password", (route) => route.abort());

			await page.getByLabel("New Password:").fill("newpassword123");
			await page.getByLabel("Confirm Password:").fill("newpassword123");
			await page.getByRole("button", { name: "Reset Password" }).click();

			await expect(page.getByText("Network error")).toBeVisible();
		});

		test("Back to Login link navigates to /register", async ({ page }) => {
			await page.getByRole("link", { name: "Back to Login" }).click();
			await expect(page).toHaveURL("/register");
		});
	});
});
