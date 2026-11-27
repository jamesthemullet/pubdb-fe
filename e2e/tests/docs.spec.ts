import { expect, test } from "@playwright/test";

test.describe("Docs page", () => {
  test("renders heading and endpoint list", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.getByRole("heading", { level: 1, name: "Documentation" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Endpoints" })).toBeVisible();
  });

  test("DocNav anchor links scroll to their sections", async ({ page }) => {
    await page.goto("/docs");
    const nav = page.getByRole("navigation", { name: "Documentation navigation" });
    const authLink = nav.getByRole("link", { name: "Authentication" });

    await authLink.click();

    await expect(page).toHaveURL(/#authentication$/);
    await expect(authLink).toHaveAttribute("aria-current", "location");
    await expect(page.locator("#authentication")).toBeInViewport();
  });

  test("CopyButton copies the curl quick-start snippet to the clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/docs");

    const copyButton = page.getByRole("button", { name: "Copy to clipboard" }).first();
    await copyButton.click();

    await expect(copyButton).toHaveAccessibleName("Copied to clipboard");
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain("curl https://api.thepubdb.com/api/v1/pubs");
  });
});
