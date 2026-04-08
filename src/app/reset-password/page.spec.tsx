import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ResetPasswordPage from "./page";

vi.mock("next/navigation", () => ({
	useSearchParams: vi.fn(),
}));

import { useSearchParams } from "next/navigation";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

function makeSearchParams(token: string | null) {
	return {
		get: (key: string) => (key === "token" ? token : null),
	};
}

describe("ResetPasswordPage", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
		process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("when token is missing from URL", () => {
		beforeEach(() => {
			vi.mocked(useSearchParams).mockReturnValue(makeSearchParams(null) as ReturnType<typeof useSearchParams>);
		});

		it("shows invalid reset link message", async () => {
			render(<ResetPasswordPage />);

			expect(
				await screen.findByRole("heading", { name: "Invalid Reset Link" }),
			).toBeInTheDocument();
			expect(
				screen.getByText("This password reset link is invalid or has expired."),
			).toBeInTheDocument();
		});

		it("shows a link to request a new reset", async () => {
			render(<ResetPasswordPage />);

			const link = await screen.findByRole("link", {
				name: "Request a new password reset",
			});
			expect(link).toHaveAttribute("href", "/forgot-password");
		});
	});

	describe("when a valid token is present", () => {
		beforeEach(() => {
			vi.mocked(useSearchParams).mockReturnValue(makeSearchParams("valid-token-123") as ReturnType<typeof useSearchParams>);
		});

		it("renders the reset password form", async () => {
			render(<ResetPasswordPage />);

			expect(
				await screen.findByRole("heading", { name: "Reset Password" }),
			).toBeInTheDocument();
			expect(screen.getByLabelText(/new password:/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/confirm password:/i)).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: "Reset Password" }),
			).toBeInTheDocument();
		});

		it("shows error when passwords do not match", async () => {
			render(<ResetPasswordPage />);

			await screen.findByLabelText(/new password:/i);

			fireEvent.change(screen.getByLabelText(/new password:/i), {
				target: { value: "password123" },
			});
			fireEvent.change(screen.getByLabelText(/confirm password:/i), {
				target: { value: "different456" },
			});
			fireEvent.submit(
				screen.getByRole("button", { name: "Reset Password" }).closest("form")!,
			);

			expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
		});

		it("shows error when password is too short", async () => {
			render(<ResetPasswordPage />);

			await screen.findByLabelText(/new password:/i);

			fireEvent.change(screen.getByLabelText(/new password:/i), {
				target: { value: "abc" },
			});
			fireEvent.change(screen.getByLabelText(/confirm password:/i), {
				target: { value: "abc" },
			});
			fireEvent.submit(
				screen.getByRole("button", { name: "Reset Password" }).closest("form")!,
			);

			expect(
				screen.getByText("Password must be at least 6 characters"),
			).toBeInTheDocument();
		});

		it("does not call the API when client-side validation fails", async () => {
			const fetchSpy = vi.spyOn(globalThis, "fetch");

			render(<ResetPasswordPage />);

			await screen.findByLabelText(/new password:/i);

			fireEvent.change(screen.getByLabelText(/new password:/i), {
				target: { value: "abc" },
			});
			fireEvent.change(screen.getByLabelText(/confirm password:/i), {
				target: { value: "abc" },
			});
			fireEvent.submit(
				screen.getByRole("button", { name: "Reset Password" }).closest("form")!,
			);

			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it("shows success message and clears form on successful reset", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ message: "Password reset successfully" }),
			);

			render(<ResetPasswordPage />);

			await screen.findByLabelText(/new password:/i);

			fireEvent.change(screen.getByLabelText(/new password:/i), {
				target: { value: "newpassword" },
			});
			fireEvent.change(screen.getByLabelText(/confirm password:/i), {
				target: { value: "newpassword" },
			});
			fireEvent.submit(
				screen.getByRole("button", { name: "Reset Password" }).closest("form")!,
			);

			await waitFor(() => {
				expect(
					screen.getByText("Password reset successfully"),
				).toBeInTheDocument();
			});

			expect(
				(screen.getByLabelText(/new password:/i) as HTMLInputElement).value,
			).toBe("");
			expect(
				(screen.getByLabelText(/confirm password:/i) as HTMLInputElement).value,
			).toBe("");
		});

		it("sends POST to /auth/reset-password with token and password", async () => {
			const fetchSpy = vi
				.spyOn(globalThis, "fetch")
				.mockResolvedValue(jsonResponse({ message: "ok" }));

			render(<ResetPasswordPage />);

			await screen.findByLabelText(/new password:/i);

			fireEvent.change(screen.getByLabelText(/new password:/i), {
				target: { value: "mysecretpassword" },
			});
			fireEvent.change(screen.getByLabelText(/confirm password:/i), {
				target: { value: "mysecretpassword" },
			});
			fireEvent.submit(
				screen.getByRole("button", { name: "Reset Password" }).closest("form")!,
			);

			await waitFor(() => {
				expect(fetchSpy).toHaveBeenCalledWith(
					"http://localhost:4000/auth/reset-password",
					expect.objectContaining({
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							token: "valid-token-123",
							password: "mysecretpassword",
						}),
					}),
				);
			});
		});

		it("shows error message when API returns an error", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ error: "Token has expired" }, 400),
			);

			render(<ResetPasswordPage />);

			await screen.findByLabelText(/new password:/i);

			fireEvent.change(screen.getByLabelText(/new password:/i), {
				target: { value: "password123" },
			});
			fireEvent.change(screen.getByLabelText(/confirm password:/i), {
				target: { value: "password123" },
			});
			fireEvent.submit(
				screen.getByRole("button", { name: "Reset Password" }).closest("form")!,
			);

			await waitFor(() => {
				expect(screen.getByText("Token has expired")).toBeInTheDocument();
			});
		});

		it("shows Network error when fetch throws", async () => {
			vi.spyOn(globalThis, "fetch").mockRejectedValue(
				new Error("Connection refused"),
			);

			render(<ResetPasswordPage />);

			await screen.findByLabelText(/new password:/i);

			fireEvent.change(screen.getByLabelText(/new password:/i), {
				target: { value: "password123" },
			});
			fireEvent.change(screen.getByLabelText(/confirm password:/i), {
				target: { value: "password123" },
			});
			fireEvent.submit(
				screen.getByRole("button", { name: "Reset Password" }).closest("form")!,
			);

			await waitFor(() => {
				expect(screen.getByText("Network error")).toBeInTheDocument();
			});
		});

		it("shows Go to Login link after successful reset", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ message: "Password reset successfully" }),
			);

			render(<ResetPasswordPage />);

			await screen.findByLabelText(/new password:/i);

			fireEvent.change(screen.getByLabelText(/new password:/i), {
				target: { value: "newpassword" },
			});
			fireEvent.change(screen.getByLabelText(/confirm password:/i), {
				target: { value: "newpassword" },
			});
			fireEvent.submit(
				screen.getByRole("button", { name: "Reset Password" }).closest("form")!,
			);

			const goToLogin = await screen.findByRole("link", { name: "Go to Login" });
			expect(goToLogin).toHaveAttribute("href", "/register");
		});
	});
});
