import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({ href, children }: { href: string; children: React.ReactNode }) => (
		<a href={href}>{children}</a>
	),
}));

import Footer from "./footer";

describe("Footer", () => {
	it("renders copyright with current year and navigation links to Terms and Privacy", () => {
		render(<Footer />);

		const year = new Date().getFullYear();
		expect(screen.getByText(new RegExp(`${year} Pub DB`))).toBeInTheDocument();

		const termsLink = screen.getByRole("link", { name: "Terms" });
		expect(termsLink).toHaveAttribute("href", "/terms");

		const privacyLink = screen.getByRole("link", { name: "Privacy" });
		expect(privacyLink).toHaveAttribute("href", "/privacy");
	});
});
