import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import VerifyPage from "./page";

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

describe("VerifyPage", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("when token is missing from URL", () => {
		beforeEach(() => {
			vi.mocked(useSearchParams).mockReturnValue(makeSearchParams(null) as ReturnType<typeof useSearchParams>);
		});

		it("shows a missing token error without calling the API", async () => {
			const fetchSpy = vi.spyOn(globalThis, "fetch");

			render(<VerifyPage />);

			expect(
				await screen.findByRole("heading", { name: "Verification Failed" }),
			).toBeInTheDocument();
			expect(
				screen.getByText("This verification link is missing a token."),
			).toBeInTheDocument();
			expect(fetchSpy).not.toHaveBeenCalled();
		});
	});

	describe("when a token is present", () => {
		beforeEach(() => {
			vi.mocked(useSearchParams).mockReturnValue(makeSearchParams("valid-token-123") as ReturnType<typeof useSearchParams>);
		});

		it("calls the verify API with the token", async () => {
			const fetchSpy = vi
				.spyOn(globalThis, "fetch")
				.mockResolvedValue(jsonResponse({ success: true, message: "Verified" }));

			render(<VerifyPage />);

			await waitFor(() => {
				expect(fetchSpy).toHaveBeenCalledWith(
					"/api/auth/verify?token=valid-token-123",
				);
			});
		});

		it("shows success message and login link when verification succeeds", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({
					success: true,
					message: "Your email has been verified. You can now log in.",
				}),
			);

			render(<VerifyPage />);

			expect(
				await screen.findByRole("heading", { name: "Email Verified" }),
			).toBeInTheDocument();
			expect(
				screen.getByText("Your email has been verified. You can now log in."),
			).toBeInTheDocument();

			const loginLink = screen.getByRole("link", { name: "Go to Login" });
			expect(loginLink).toHaveAttribute("href", "/register");
		});

		it("shows an error when the link is invalid or expired", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(
					{
						success: false,
						error: "Bad Request",
						message: "Verification link is invalid or expired.",
					},
					400,
				),
			);

			render(<VerifyPage />);

			expect(
				await screen.findByRole("heading", { name: "Verification Failed" }),
			).toBeInTheDocument();
			expect(
				screen.getByText("Verification link is invalid or expired."),
			).toBeInTheDocument();

			const loginLink = screen.getByRole("link", { name: "Back to Login" });
			expect(loginLink).toHaveAttribute("href", "/register");
		});

		it("shows a generic error when fetch throws", async () => {
			vi.spyOn(globalThis, "fetch").mockRejectedValue(
				new Error("Connection refused"),
			);

			render(<VerifyPage />);

			expect(
				await screen.findByText("Connection refused"),
			).toBeInTheDocument();
		});
	});
});
