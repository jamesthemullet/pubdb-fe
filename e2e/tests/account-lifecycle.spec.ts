import { expect, test } from "@playwright/test";

function jsonResponse(body: unknown, status = 200) {
	return {
		status,
		contentType: "application/json",
		body: JSON.stringify(body),
	};
}

// auth.spec.ts, forgot-password.spec.ts, and reset-password.spec.ts each cover
// their own step in isolation with mocked network responses. This spec chains
// register -> sign in -> forgot password -> reset password into a single flow
// to catch regressions in how a user actually moves between those pages.
test.describe("Account lifecycle: register -> sign in -> forgot password -> reset password", () => {
	test("completes the full chained flow with mocked API responses", async ({
		page,
	}) => {
		const email = "lifecycle-user@example.com";
		const password = "password123";

		// 1. Register
		await page.goto("/register");
		await page.getByRole("button", { name: /create an account/i }).click();

		await page.route("**/auth/register", (route) =>
			route.fulfill(jsonResponse({ message: "Registered" })),
		);

		await page.locator("#ag-name").fill("Lifecycle User");
		await page.locator("#ag-username").fill("lifecycleuser");
		await page.locator("#ag-email").fill(email);
		await page.locator("#ag-password").fill(password);
		await page.getByRole("button", { name: "Create account" }).click();

		await expect(page.getByText(/registration successful/i)).toBeVisible();

		// 2. Sign in with the newly registered account
		await page.getByRole("button", { name: "Log in" }).click();

		const fakeToken = [
			Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url"),
			Buffer.from(JSON.stringify({ email })).toString("base64url"),
			"sig",
		].join(".");

		await page.route("**/auth/login", (route) =>
			route.fulfill(jsonResponse({ token: fakeToken })),
		);
		await page.route("**/auth/me", (route) =>
			route.fulfill(jsonResponse({ email, approved: true })),
		);

		await page.locator("#ag-email").fill(email);
		await page.locator("#ag-password").fill(password);
		await page.getByRole("button", { name: "Log in" }).click();

		await page.waitForURL("/");
		await expect(page.locator("aside")).toContainText(email);

		// 3. Request a password reset
		await page.goto("/forgot-password");
		await page.route("**/auth/forgot-password", (route) =>
			route.fulfill(jsonResponse({ message: "Password reset email sent" })),
		);

		await page.getByLabel("Email").fill(email);
		await page.getByRole("button", { name: "Send Reset Link" }).click();

		await expect(page.getByText("Password reset email sent")).toBeVisible();

		// 4. Follow the reset link and set a new password
		await page.goto("/reset-password?token=lifecycle-test-token");
		await page.route("**/auth/reset-password", (route) =>
			route.fulfill(jsonResponse({ message: "Password reset successfully" })),
		);

		await page.getByLabel("New Password:").fill("newpassword456");
		await page.getByLabel("Confirm Password:").fill("newpassword456");
		await page.getByRole("button", { name: "Reset Password" }).click();

		await expect(page.getByText("Password reset successfully")).toBeVisible();

		// 5. Land back on the login page to sign in with the new password
		await page.getByRole("link", { name: "Go to Login" }).click();
		await expect(page).toHaveURL("/register");
		await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
	});
});
