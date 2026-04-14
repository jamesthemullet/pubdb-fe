import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SuccessPage from "./page";

vi.mock("next/navigation", () => ({
	useSearchParams: vi.fn(),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => <a href={href}>{children}</a>,
}));

import { useSearchParams } from "next/navigation";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

function makeSearchParams(sessionId: string | null) {
	return {
		get: (key: string) => (key === "session_id" ? sessionId : null),
	};
}

const SAMPLE_STATUS = {
	success: true,
	message: "Your subscription is now active.",
	subscription: {
		subscriptionId: "sub_abc123",
		status: "active",
		tier: "Pro",
		billingDay: 15,
	},
	apiKey: {
		key: "pk_live_secret",
		keyPrefix: "pk_live",
	},
};

describe("SuccessPage", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
		process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("when session_id is missing from URL", () => {
		beforeEach(() => {
			vi.mocked(useSearchParams).mockReturnValue(
				makeSearchParams(null) as ReturnType<typeof useSearchParams>,
			);
		});

		it("shows an error message", async () => {
			render(<SuccessPage />);

			await waitFor(() => {
				expect(
					screen.getByText("No session ID provided"),
				).toBeInTheDocument();
			});
		});

		it("does not call the API", async () => {
			const fetchSpy = vi.spyOn(globalThis, "fetch");

			render(<SuccessPage />);

			await waitFor(() => {
				expect(screen.getByText("No session ID provided")).toBeInTheDocument();
			});

			expect(fetchSpy).not.toHaveBeenCalled();
		});
	});

	describe("when a valid session_id is present", () => {
		beforeEach(() => {
			vi.mocked(useSearchParams).mockReturnValue(
				makeSearchParams("cs_test_abc123") as ReturnType<typeof useSearchParams>,
			);
		});

		it("shows a loading state initially", () => {
			vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));

			render(<SuccessPage />);

			expect(
				screen.getByText("Verifying your subscription..."),
			).toBeInTheDocument();
		});

		it("shows subscription details after successful verification", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_STATUS),
			);

			render(<SuccessPage />);

			await waitFor(() => {
				expect(
					screen.getByText("Subscription Successful!"),
				).toBeInTheDocument();
			});

			expect(
				screen.getByText("Your subscription is now active."),
			).toBeInTheDocument();
			expect(screen.getByText("sub_abc123")).toBeInTheDocument();
			expect(screen.getByText("pk_live_secret")).toBeInTheDocument();
		});

		it("shows a View Dashboard link after successful verification", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse(SAMPLE_STATUS),
			);

			render(<SuccessPage />);

			const link = await screen.findByRole("link", { name: "View Dashboard" });
			expect(link).toHaveAttribute("href", "/");
		});

		it("shows an error message when verification fails", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ message: "Session not found" }, 400),
			);

			render(<SuccessPage />);

			await waitFor(() => {
				expect(screen.getByText("Session not found")).toBeInTheDocument();
			});
		});

		it("shows a network error when fetch throws", async () => {
			vi.spyOn(globalThis, "fetch").mockRejectedValue(
				new Error("Network error"),
			);

			render(<SuccessPage />);

			await waitFor(() => {
				expect(screen.getByText("Network error")).toBeInTheDocument();
			});
		});

		it("calls the verify-session endpoint with the session ID", async () => {
			const fetchSpy = vi
				.spyOn(globalThis, "fetch")
				.mockResolvedValue(jsonResponse(SAMPLE_STATUS));

			render(<SuccessPage />);

			await waitFor(() => {
				expect(fetchSpy).toHaveBeenCalledWith(
					"/api/payments/verify-session",
					expect.objectContaining({
						method: "POST",
						body: JSON.stringify({ sessionId: "cs_test_abc123" }),
					}),
				);
			});
		});

		it("shows the subscription failed state when success is false", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({
					...SAMPLE_STATUS,
					success: false,
					message: "Payment was declined.",
				}),
			);

			render(<SuccessPage />);

			await waitFor(() => {
				expect(screen.getByText("Subscription Failed")).toBeInTheDocument();
			});

			expect(screen.getByText("Payment was declined.")).toBeInTheDocument();
		});

		it("formats the billing day with the correct ordinal suffix", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({
					...SAMPLE_STATUS,
					subscription: { ...SAMPLE_STATUS.subscription, billingDay: 1 },
				}),
			);

			render(<SuccessPage />);

			await waitFor(() => {
				expect(screen.getByText(/1st of each month/)).toBeInTheDocument();
			});
		});
	});
});
