import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => <a href={href}>{children}</a>,
}));

import AuthGate from "./AuthGate";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("AuthGate", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("renders in login mode by default with email and password fields", () => {
		render(<AuthGate />);
		expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
		expect(screen.getByLabelText("Email")).toBeInTheDocument();
		expect(screen.getByLabelText("Password")).toBeInTheDocument();
		expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
	});

	it("renders the context message when provided", () => {
		render(<AuthGate context="Sign in to edit this pub" />);
		expect(screen.getByText("Sign in to edit this pub")).toBeInTheDocument();
	});

	it("switches to register mode showing extra fields when 'Create an account' is clicked", () => {
		render(<AuthGate />);
		fireEvent.click(screen.getByRole("button", { name: "Create an account" }));
		expect(
			screen.getByRole("heading", { name: "Create an account" }),
		).toBeInTheDocument();
		expect(screen.getByLabelText("Name")).toBeInTheDocument();
		expect(screen.getByLabelText("Username")).toBeInTheDocument();
	});

	it("shows an error alert when login returns a non-ok response", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ error: "Invalid credentials" }, 401),
		);
		render(<AuthGate />);

		fireEvent.change(screen.getByLabelText("Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "wrong-password" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Log in" }));

		await waitFor(() =>
			expect(screen.getByRole("alert")).toHaveTextContent(
				"Invalid credentials",
			),
		);
	});

	it("stores the token in localStorage and calls onLogin on successful login", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ token: "my-token" }),
		);
		const onLogin = vi.fn();
		render(<AuthGate onLogin={onLogin} />);

		fireEvent.change(screen.getByLabelText("Email"), {
			target: { value: "test@example.com" },
		});
		fireEvent.change(screen.getByLabelText("Password"), {
			target: { value: "correct-password" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Log in" }));

		await waitFor(() => expect(onLogin).toHaveBeenCalledTimes(1));
		expect(localStorage.getItem("token")).toBe("my-token");
	});
});
