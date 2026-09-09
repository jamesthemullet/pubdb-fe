import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DocNav } from "./DocNav";

describe("DocNav", () => {
	it("renders a nav element with the correct aria-label", () => {
		render(<DocNav />);

		expect(screen.getByRole("navigation", { name: "Documentation navigation" })).toBeInTheDocument();
	});

	it("renders all seven section links with correct anchor hrefs", () => {
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
			expect(link).toBeInTheDocument();
			expect(link).toHaveAttribute("href", href);
		}
	});

	it("renders the support email link", () => {
		render(<DocNav />);

		const emailLink = screen.getByRole("link", { name: "hello@thepubdb.com" });
		expect(emailLink).toHaveAttribute("href", "mailto:hello@thepubdb.com");
	});
});
