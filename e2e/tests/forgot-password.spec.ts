import { expect, test } from "@playwright/test";

function jsonResponse(body: unknown, status = 200) {
	return {
		status,
		contentType: "application/json",
		body: JSON.stringify(body),
	};
}

test.describe("Forgot Password page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/forgot-password");
	});

	test("renders email field and submit button", async ({ page }) => {
		await expect(page.getByLabel("Email:")).toBeVisible();
		await expect(
			page.getByRole("button", { name: "Send Reset Link" }),
		).toBeVisible();
	});

	test("shows success message after valid submission", async ({ page }) => {
		await page.route("**/auth/forgot-password", (route) =>
			route.fulfill(jsonResponse({ message: "Password reset email sent" })),
		);

		await page.getByLabel("Email:").fill("user@example.com");
		await page.getByRole("button", { name: "Send Reset Link" }).click();

		await expect(page.getByText("Password reset email sent")).toBeVisible();
	});

	test("clears the email field after successful submission", async ({
		page,
	}) => {
		await page.route("**/auth/forgot-password", (route) =>
			route.fulfill(jsonResponse({ message: "Email sent" })),
		);

		await page.getByLabel("Email:").fill("user@example.com");
		await page.getByRole("button", { name: "Send Reset Link" }).click();

		await expect(page.getByText("Email sent")).toBeVisible();
		await expect(page.getByLabel("Email:")).toHaveValue("");
	});

	test("shows API error on failure", async ({ page }) => {
		await page.route("**/auth/forgot-password", (route) =>
			route.fulfill(jsonResponse({ error: "No account found" }, 404)),
		);

		await page.getByLabel("Email:").fill("unknown@example.com");
		await page.getByRole("button", { name: "Send Reset Link" }).click();

		await expect(page.getByText("No account found")).toBeVisible();
	});

	test("shows network error message when request fails", async ({ page }) => {
		await page.route("**/auth/forgot-password", (route) => route.abort());

		await page.getByLabel("Email:").fill("user@example.com");
		await page.getByRole("button", { name: "Send Reset Link" }).click();

		await expect(page.getByText("Network error")).toBeVisible();
	});

	test("Back to Login link navigates to /register", async ({ page }) => {
		await page.getByRole("link", { name: "Back to Login" }).click();
		await expect(page).toHaveURL("/register");
	});
});
