import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		onClick,
	}: {
		href: string;
		children: React.ReactNode;
		onClick?: () => void;
	}) => (
		<a href={href} onClick={onClick}>
			{children}
		</a>
	),
}));

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/useAuth", () => ({
	useAuth: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
	buildAuthHeaders: () => ({}),
}));

import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./sidebar";

describe("Sidebar", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		vi.mocked(useAuth).mockReturnValue({ user: null, isApproved: false, isAdmin: false });
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("renders all workspace and account navigation links", () => {
		render(<Sidebar />);

		expect(screen.getByRole("link", { name: "Overview" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Browse pubs/ })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Add pub" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "API keys" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Docs" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Leaderboard" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Billing" })).toBeInTheDocument();
	});

	it("shows 'Register / Log in' when unauthenticated and user initials + Log out when authenticated", () => {
		const { rerender } = render(<Sidebar />);

		expect(screen.getByRole("link", { name: "Register / Log in" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();

		vi.mocked(useAuth).mockReturnValue({
			user: { email: "test@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ apiKeys: [] }), { status: 200 }),
		);
		rerender(<Sidebar />);

		expect(screen.queryByRole("link", { name: "Register / Log in" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
		expect(screen.getByText("TE")).toBeInTheDocument();
	});

	it("toggles the mobile menu open and closed, and Escape key closes it", () => {
		render(<Sidebar />);

		const openBtn = screen.getByRole("button", { name: "Open menu" });
		expect(openBtn).toHaveAttribute("aria-expanded", "false");

		fireEvent.click(openBtn);
		expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");

		fireEvent.keyDown(document, { key: "Escape" });
		expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
	});
});
