import { expect, test } from "@playwright/test";

function jsonResponse(body: unknown, status = 200) {
	return {
		status,
		contentType: "application/json",
		body: JSON.stringify(body),
	};
}

// The register page labels are not associated with inputs via htmlFor/id,
// so we select inputs by their name attribute instead.
const field = {
	name: 'input[name="name"]',
	username: 'input[name="username"]',
	email: 'input[name="email"]',
	password: 'input[name="password"]',
};

test.describe("Register / Login page", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/register");
	});

	test.describe("Register mode (default)", () => {
		test("shows Name, Username, Email and Password fields", async ({
			page,
		}) => {
			await expect(page.locator(field.name)).toBeVisible();
			await expect(page.locator(field.username)).toBeVisible();
			await expect(page.locator(field.email)).toBeVisible();
			await expect(page.locator(field.password)).toBeVisible();
		});

		test("shows Register submit button", async ({ page }) => {
			await expect(
				page.getByRole("button", { name: "Register" }),
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
			await page.getByRole("button", { name: "Register" }).click();

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
			await page.getByRole("button", { name: "Register" }).click();

			await expect(page.getByText("Email already in use")).toBeVisible();
		});

		test("network error shows generic error message", async ({ page }) => {
			await page.route("**/auth/register", (route) => route.abort());

			await page.locator(field.name).fill("Test User");
			await page.locator(field.username).fill("testuser");
			await page.locator(field.email).fill("test@example.com");
			await page.locator(field.password).fill("password123");
			await page.getByRole("button", { name: "Register" }).click();

			await expect(page.getByText("Network error")).toBeVisible();
		});
	});

	test.describe("switching modes", () => {
		test("toggling to Login hides Name and Username fields", async ({
			page,
		}) => {
			await page
				.getByRole("button", { name: /already have an account/i })
				.click();

			await expect(page.locator(field.name)).not.toBeVisible();
			await expect(page.locator(field.username)).not.toBeVisible();
			await expect(page.locator(field.email)).toBeVisible();
			await expect(page.locator(field.password)).toBeVisible();
		});

		test("toggling to Login shows Forgot your password? link", async ({
			page,
		}) => {
			await page
				.getByRole("button", { name: /already have an account/i })
				.click();

			await expect(
				page.getByRole("link", { name: /forgot your password/i }),
			).toBeVisible();
		});

		test("toggling back to Register restores Name and Username fields", async ({
			page,
		}) => {
			await page
				.getByRole("button", { name: /already have an account/i })
				.click();
			await page.getByRole("button", { name: /need an account/i }).click();

			await expect(page.locator(field.name)).toBeVisible();
			await expect(page.locator(field.username)).toBeVisible();
		});
	});

	test.describe("Login mode", () => {
		test.beforeEach(async ({ page }) => {
			await page
				.getByRole("button", { name: /already have an account/i })
				.click();
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
			await page.getByRole("button", { name: "Login" }).click();

			await expect(page.getByText("Login successful!")).toBeVisible();

			// Component does window.location.href redirect after 500ms
			await page.waitForURL("/");
			await expect(page.locator("aside")).toContainText("user@example.com");
		});

		test("API error is shown on failed login", async ({ page }) => {
			await page.route("**/auth/login", (route) =>
				route.fulfill(jsonResponse({ error: "Invalid credentials" }, 401)),
			);

			await page.locator(field.email).fill("wrong@example.com");
			await page.locator(field.password).fill("wrongpass");
			await page.getByRole("button", { name: "Login" }).click();

			await expect(page.getByText("Invalid credentials")).toBeVisible();
		});

		test("network error shows generic error message", async ({ page }) => {
			await page.route("**/auth/login", (route) => route.abort());

			await page.locator(field.email).fill("user@example.com");
			await page.locator(field.password).fill("password123");
			await page.getByRole("button", { name: "Login" }).click();

			await expect(page.getByText("Network error")).toBeVisible();
		});
	});
});
