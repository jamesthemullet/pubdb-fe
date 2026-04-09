import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ForgotPasswordPage from "./page";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("ForgotPasswordPage", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
		process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("renders the form with heading and email input", () => {
		render(<ForgotPasswordPage />);

		expect(
			screen.getByRole("heading", { name: "Forgot Password" }),
		).toBeInTheDocument();
		expect(screen.getByLabelText(/email:/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Send Reset Link" }),
		).toBeInTheDocument();
	});

	it("renders back to login link", () => {
		render(<ForgotPasswordPage />);

		expect(screen.getByRole("link", { name: "Back to Login" })).toHaveAttribute(
			"href",
			"/register",
		);
	});

	it("shows success message and clears the form on successful submission", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ message: "Reset link sent to your email" }),
		);

		render(<ForgotPasswordPage />);

		fireEvent.change(screen.getByLabelText(/email:/i), {
			target: { value: "user@example.com" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Send Reset Link" }).closest("form")!);

		await waitFor(() => {
			expect(
				screen.getByText("Reset link sent to your email"),
			).toBeInTheDocument();
		});

		expect((screen.getByLabelText(/email:/i) as HTMLInputElement).value).toBe(
			"",
		);
	});

	it("sends POST to /auth/forgot-password with the email", async () => {
		const fetchSpy = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(jsonResponse({ message: "ok" }));

		render(<ForgotPasswordPage />);

		fireEvent.change(screen.getByLabelText(/email:/i), {
			target: { value: "test@example.com" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Send Reset Link" }).closest("form")!);

		await waitFor(() => {
			expect(fetchSpy).toHaveBeenCalledWith(
				"http://localhost:4000/auth/forgot-password",
				expect.objectContaining({
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email: "test@example.com" }),
				}),
			);
		});
	});

	it("shows error message when the API returns an error", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ error: "Email not found" }, 400),
		);

		render(<ForgotPasswordPage />);

		fireEvent.change(screen.getByLabelText(/email:/i), {
			target: { value: "unknown@example.com" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Send Reset Link" }).closest("form")!);

		await waitFor(() => {
			expect(screen.getByText("Email not found")).toBeInTheDocument();
		});
	});

	it("shows Network error when fetch throws", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network down"));

		render(<ForgotPasswordPage />);

		fireEvent.change(screen.getByLabelText(/email:/i), {
			target: { value: "user@example.com" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Send Reset Link" }).closest("form")!);

		await waitFor(() => {
			expect(screen.getByText("Network error")).toBeInTheDocument();
		});
	});

	it("disables the button and shows loading text while submitting", async () => {
		let resolveRequest!: (value: Response) => void;
		vi.spyOn(globalThis, "fetch").mockReturnValue(
			new Promise<Response>((res) => {
				resolveRequest = res;
			}),
		);

		render(<ForgotPasswordPage />);

		fireEvent.change(screen.getByLabelText(/email:/i), {
			target: { value: "user@example.com" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Send Reset Link" }).closest("form")!);

		await waitFor(() => {
			const btn = screen.getByRole("button", { name: "Sending..." });
			expect(btn).toBeDisabled();
		});

		resolveRequest(jsonResponse({ message: "Sent" }));

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: "Send Reset Link" }),
			).not.toBeDisabled();
		});
	});

	it("uses fallback error message when API error field is missing", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ message: "Processed" }, 400),
		);

		render(<ForgotPasswordPage />);

		fireEvent.change(screen.getByLabelText(/email:/i), {
			target: { value: "user@example.com" },
		});
		fireEvent.submit(screen.getByRole("button", { name: "Send Reset Link" }).closest("form")!);

		await waitFor(() => {
			expect(screen.getByText("Unknown error")).toBeInTheDocument();
		});
	});
});
