import { expect, test } from "@playwright/test";

function jsonResponse(body: unknown, status = 200) {
	return {
		status,
		contentType: "application/json",
		body: JSON.stringify(body),
	};
}

test.describe("Verify Email page", () => {
	test.describe("without a token", () => {
		test("shows a missing-token error without calling the API", async ({
			page,
		}) => {
			let apiCalled = false;
			await page.route("**/auth/verify**", (route) => {
				apiCalled = true;
				return route.continue();
			});

			await page.goto("/verify");

			await expect(
				page.getByRole("heading", { name: "Verification Failed" }),
			).toBeVisible();
			await expect(
				page.getByText("This verification link is missing a token."),
			).toBeVisible();
			expect(apiCalled).toBe(false);
		});
	});

	test.describe("with a token", () => {
		test("shows success message and Go to Login link on success", async ({
			page,
		}) => {
			await page.route("**/auth/verify**", (route) =>
				route.fulfill(
					jsonResponse({
						success: true,
						message: "Your email has been verified. You can now log in.",
					}),
				),
			);

			await page.goto("/verify?token=valid-token-123");

			await expect(
				page.getByRole("heading", { name: "Email Verified" }),
			).toBeVisible();
			await expect(
				page.getByText("Your email has been verified. You can now log in."),
			).toBeVisible();
			await expect(
				page.getByRole("link", { name: "Go to Login" }),
			).toHaveAttribute("href", "/register");
		});

		test("shows API error message on failure", async ({ page }) => {
			await page.route("**/auth/verify**", (route) =>
				route.fulfill(
					jsonResponse(
						{
							success: false,
							error: "Bad Request",
							message: "Verification link is invalid or expired.",
						},
						400,
					),
				),
			);

			await page.goto("/verify?token=expired-token");

			await expect(
				page.getByRole("heading", { name: "Verification Failed" }),
			).toBeVisible();
			await expect(
				page.getByText("Verification link is invalid or expired."),
			).toBeVisible();
			await expect(
				page.getByRole("link", { name: "Back to Login" }),
			).toHaveAttribute("href", "/register");
		});
	});
});
