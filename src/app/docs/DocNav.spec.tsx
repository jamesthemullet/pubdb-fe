import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DocNav } from "./DocNav";

describe("DocNav", () => {
	it("renders a navigation landmark with an accessible label", () => {
		render(<DocNav />);
		expect(screen.getByRole("navigation", { name: "Documentation navigation" })).toBeInTheDocument();
	});

	it("renders all expected nav links with correct href anchors", () => {
		render(<DocNav />);
		const expectedLinks = [
			{ label: "Quick start", href: "#quick-start" },
			{ label: "Authentication", href: "#authentication" },
			{ label: "Endpoints", href: "#endpoints" },
			{ label: "Filtering & search", href: "#filtering" },
			{ label: "Pagination", href: "#pagination" },
			{ label: "Rate limits", href: "#rate-limits" },
			{ label: "Errors", href: "#errors" },
		];
		for (const { label, href } of expectedLinks) {
			const link = screen.getByRole("link", { name: label });
			expect(link).toHaveAttribute("href", href);
		}
	});

	it("renders the 'Need help?' section with a support email link", () => {
		render(<DocNav />);
		const nav = screen.getByRole("navigation");
		expect(within(nav).getByText("Need help?")).toBeInTheDocument();
		const emailLink = within(nav).getByRole("link", { name: "hello@thepubdb.com" });
		expect(emailLink).toHaveAttribute("href", "mailto:hello@thepubdb.com");
	});
});
