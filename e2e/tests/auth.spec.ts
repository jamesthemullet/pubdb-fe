import { expect, test } from "@playwright/test";

function jsonResponse(body: unknown, status = 200) {
	return {
		status,
		contentType: "application/json",
		body: JSON.stringify(body),
	};
}

// The /register page renders AuthGate, which uses id-based selectors.
const field = {
	name: "#ag-name",
	username: "#ag-username",
	email: "#ag-email",
	password: "#ag-password",
};

test.describe("Register / Login page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/register");
	});

	// The page defaults to Login mode.
	test.describe("Login mode (default)", () => {
		test("shows Email and Password fields but not Name or Username", async ({
			page,
		}) => {
			await expect(page.locator(field.email)).toBeVisible();
			await expect(page.locator(field.password)).toBeVisible();
			await expect(page.locator(field.name)).not.toBeVisible();
			await expect(page.locator(field.username)).not.toBeVisible();
		});

		test("shows Log in submit button", async ({ page }) => {
			await expect(
				page.getByRole("button", { name: "Log in" }),
			).toBeVisible();
		});

		test("shows Forgot your password? link", async ({ page }) => {
			await expect(
				page.getByRole("link", { name: /forgot.*password/i }),
			).toBeVisible();
		});

		test("successful login stores token, updates nav, and redirects", async ({
			page,
		}) => {
			const fakeToken = [
				Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url"),
				Buffer.from(JSON.stringify({ email: "user@example.com" })).toString(
					"base64url",
				),
				"sig",
			].join(".");

			await page.route("**/auth/login", (route) =>
				route.fulfill(jsonResponse({ token: fakeToken })),
			);

			await page.locator(field.email).fill("user@example.com");
			await page.locator(field.password).fill("password123");
			await page.getByRole("button", { name: "Log in" }).click();

			// AuthGate calls onLogin which triggers a redirect after ~300 ms
			await page.waitForURL("/");
			await expect(page.locator("aside")).toContainText("user@example.com");
		});

		test("API error is shown on failed login", async ({ page }) => {
			await page.route("**/auth/login", (route) =>
				route.fulfill(jsonResponse({ error: "Invalid credentials" }, 401)),
			);

			await page.locator(field.email).fill("wrong@example.com");
			await page.locator(field.password).fill("wrongpass");
			await page.getByRole("button", { name: "Log in" }).click();

			await expect(page.getByText("Invalid credentials")).toBeVisible();
		});

		test("network error shows generic error message", async ({ page }) => {
			await page.route("**/auth/login", (route) => route.abort());

			await page.locator(field.email).fill("user@example.com");
			await page.locator(field.password).fill("password123");
			await page.getByRole("button", { name: "Log in" }).click();

			await expect(page.getByText("Network error")).toBeVisible();
		});
	});

	test.describe("switching modes", () => {
		test("clicking Create an account shows Name and Username fields", async ({
			page,
		}) => {
			await page
				.getByRole("button", { name: /create an account/i })
				.click();

			await expect(page.locator(field.name)).toBeVisible();
			await expect(page.locator(field.username)).toBeVisible();
			await expect(page.locator(field.email)).toBeVisible();
			await expect(page.locator(field.password)).toBeVisible();
		});

		test("toggling back to Login hides Name and Username fields", async ({
			page,
		}) => {
			await page
				.getByRole("button", { name: /create an account/i })
				.click();
			await page.getByRole("button", { name: "Log in" }).click();

			await expect(page.locator(field.name)).not.toBeVisible();
			await expect(page.locator(field.username)).not.toBeVisible();
		});
	});

	test.describe("Register mode", () => {
		test.beforeEach(async ({ page }) => {
			await page
				.getByRole("button", { name: /create an account/i })
				.click();
		});

		test("shows Name, Username, Email and Password fields", async ({
			page,
		}) => {
			await expect(page.locator(field.name)).toBeVisible();
			await expect(page.locator(field.username)).toBeVisible();
			await expect(page.locator(field.email)).toBeVisible();
			await expect(page.locator(field.password)).toBeVisible();
		});

		test("shows Create account submit button", async ({ page }) => {
			await expect(
				page.getByRole("button", { name: "Create account" }),
			).toBeVisible();
		});

		test("successful registration shows confirmation message", async ({
			page,
		}) => {
			await page.route("**/auth/register", (route) =>
				route.fulfill(jsonResponse({ message: "Registered" })),
			);

			await page.locator(field.name).fill("Test User");
			await page.locator(field.username).fill("testuser");
			await page.locator(field.email).fill("test@example.com");
			await page.locator(field.password).fill("password123");
			await page.getByRole("button", { name: "Create account" }).click();

			await expect(page.getByText(/registration successful/i)).toBeVisible();
		});

		test("API error is shown on failed registration", async ({ page }) => {
			await page.route("**/auth/register", (route) =>
				route.fulfill(jsonResponse({ error: "Email already in use" }, 409)),
			);

			await page.locator(field.name).fill("Test User");
			await page.locator(field.username).fill("testuser");
			await page.locator(field.email).fill("taken@example.com");
			await page.locator(field.password).fill("password123");
			await page.getByRole("button", { name: "Create account" }).click();

			await expect(page.getByText("Email already in use")).toBeVisible();
		});

		test("network error shows generic error message", async ({ page }) => {
			await page.route("**/auth/register", (route) => route.abort());

			await page.locator(field.name).fill("Test User");
			await page.locator(field.username).fill("testuser");
			await page.locator(field.email).fill("test@example.com");
			await page.locator(field.password).fill("password123");
			await page.getByRole("button", { name: "Create account" }).click();

			await expect(page.getByText("Network error")).toBeVisible();
		});
	});
});
