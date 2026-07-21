import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("@/hooks/useAuth", () => ({
	useAuth: vi.fn(),
}));

vi.mock("next/link", () => ({
	default: ({ href, children }: { href: string; children: React.ReactNode }) => (
		<a href={href}>{children}</a>
	),
}));

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import SettingsPage from "./page";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("SettingsPage", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
		vi.mocked(useAuth).mockReturnValue({ user: null, isApproved: false, isAdmin: false });
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("shows an auth gate when the user is not authenticated", () => {
		vi.mocked(useAuth).mockReturnValue({ user: null, isApproved: false, isAdmin: false });
		render(<SettingsPage />);
		expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
	});

	it("shows the Settings heading when authenticated", () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		render(<SettingsPage />);
		expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
	});

	it("shows the Danger zone nav item when authenticated", () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		render(<SettingsPage />);
		expect(screen.getByRole("button", { name: /Danger zone/i })).toBeInTheDocument();
	});

	it("initially shows the Delete account button and hides the confirmation form", () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		render(<SettingsPage />);
		expect(screen.getByRole("button", { name: /Delete account/i })).toBeInTheDocument();
		expect(screen.queryByPlaceholderText("••••••••")).not.toBeInTheDocument();
	});

	it("clicking Delete account reveals the confirmation form", () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		render(<SettingsPage />);
		fireEvent.click(screen.getByRole("button", { name: /Delete account/i }));
		expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Confirm delete/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
	});

	it("Cancel hides the confirmation form and restores the initial Delete button", () => {
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		render(<SettingsPage />);
		fireEvent.click(screen.getByRole("button", { name: /Delete account/i }));
		fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
		expect(screen.queryByPlaceholderText("••••••••")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Delete account/i })).toBeInTheDocument();
	});

	it("on success clears the token, dispatches authChanged, and redirects to /", async () => {
		localStorage.setItem("token", "test-token");
		const push = vi.fn();
		vi.mocked(useRouter).mockReturnValue({ push } as ReturnType<typeof useRouter>);
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
		const dispatchSpy = vi.spyOn(window, "dispatchEvent");

		render(<SettingsPage />);
		fireEvent.click(screen.getByRole("button", { name: /Delete account/i }));
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "my-password" },
		});
		await act(async () => {
			fireEvent.submit(screen.getByRole("button", { name: /Confirm delete/i }).closest("form")!);
		});

		expect(localStorage.getItem("token")).toBeNull();
		expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
		expect(push).toHaveBeenCalledWith("/");
	});

	it("shows 'Incorrect password.' for a 401 with 'Invalid credentials'", async () => {
		localStorage.setItem("token", "test-token");
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ error: "Invalid credentials" }, 401)
		);

		render(<SettingsPage />);
		fireEvent.click(screen.getByRole("button", { name: /Delete account/i }));
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "wrong-password" },
		});
		await act(async () => {
			fireEvent.submit(screen.getByRole("button", { name: /Confirm delete/i }).closest("form")!);
		});

		await waitFor(() => {
			expect(screen.getByText("Incorrect password.")).toBeInTheDocument();
		});
	});

	it("shows 'Password is required.' for a 400 response with errors", async () => {
		localStorage.setItem("token", "test-token");
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ errors: ["Password is required"] }, 400)
		);

		render(<SettingsPage />);
		fireEvent.click(screen.getByRole("button", { name: /Delete account/i }));
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "x" },
		});
		await act(async () => {
			fireEvent.submit(screen.getByRole("button", { name: /Confirm delete/i }).closest("form")!);
		});

		await waitFor(() => {
			expect(screen.getByText("Password is required.")).toBeInTheDocument();
		});
	});

	it("shows a generic error message when fetch throws", async () => {
		localStorage.setItem("token", "test-token");
		vi.mocked(useAuth).mockReturnValue({
			user: { email: "alice@example.com", approved: true },
			isApproved: true,
			isAdmin: false,
		});
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network down"));

		render(<SettingsPage />);
		fireEvent.click(screen.getByRole("button", { name: /Delete account/i }));
		fireEvent.change(screen.getByPlaceholderText("••••••••"), {
			target: { value: "my-password" },
		});
		await act(async () => {
			fireEvent.submit(screen.getByRole("button", { name: /Confirm delete/i }).closest("form")!);
		});

		await waitFor(() => {
			expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
		});
	});
});
