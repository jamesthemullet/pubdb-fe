import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({ href, children }: { href: string; children: React.ReactNode }) => (
		<a href={href}>{children}</a>
	),
}));

import Footer from "./footer";

describe("Footer", () => {
	it("renders the current year in the copyright notice", () => {
		render(<Footer />);
		const year = new Date().getFullYear().toString();
		expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
	});

	it("renders links to the Terms and Privacy pages", () => {
		render(<Footer />);
		expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
		expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
	});
});
