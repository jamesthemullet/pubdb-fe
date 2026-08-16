import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({ href, children }: { href: string; children: React.ReactNode }) => (
		<a href={href}>{children}</a>
	),
}));

vi.mock("@/hooks/useTheme", () => ({
	useTheme: vi.fn(),
}));

import { useTheme } from "@/hooks/useTheme";
import Topbar from "./topbar";

describe("Topbar", () => {
	beforeEach(() => {
		vi.mocked(useTheme).mockReturnValue({ theme: "light", setTheme: vi.fn(), toggleTheme: vi.fn() });
	});

	it("renders the changelog link", () => {
		render(<Topbar />);
		expect(screen.getByRole("link", { name: /What.s new/i })).toHaveAttribute("href", "/changelog");
	});

	it("labels the theme button appropriately for each mode", () => {
		const { rerender } = render(<Topbar />);
		expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();

		vi.mocked(useTheme).mockReturnValue({ theme: "dark", setTheme: vi.fn(), toggleTheme: vi.fn() });
		rerender(<Topbar />);
		expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
	});

	it("calls toggleTheme when the theme button is clicked", () => {
		const toggleTheme = vi.fn();
		vi.mocked(useTheme).mockReturnValue({ theme: "light", setTheme: vi.fn(), toggleTheme });
		render(<Topbar />);

		fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));

		expect(toggleTheme).toHaveBeenCalledOnce();
	});
});
