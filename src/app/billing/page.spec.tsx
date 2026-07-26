import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/features/pricing/pricing", () => ({
	default: () => null,
}));

import BillingPage from "./page";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

const SAMPLE_API_KEY = {
	name: "My Key",
	tier: "PRO",
	isActive: true,
	usageCount: 10,
	remaining: { hour: 80, day: 800, month: 8000 },
	limits: {
		requestsPerHour: 100,
		requestsPerDay: 1000,
		requestsPerMonth: 10000,
	},
	resetTimes: {
		hour: new Date(Date.now() + 30 * 60000).toISOString(),
		day: "2026-07-05T00:00:00.000Z",
		month: "2026-08-01T00:00:00.000Z",
	},
};

const DASHBOARD_DATA = {
	user: { name: "Alice Smith", email: "alice@example.com" },
	apiKeys: [SAMPLE_API_KEY],
	summary: { totalApiKeys: 1, totalUsage: 10 },
};

const BILLING_DATA_PAID = {
	plan: { tier: "pro", price: 2900, currency: "gbp", interval: "month" },
	status: "active",
	cancelAtPeriodEnd: false,
	currentPeriodEnd: "2026-08-04T00:00:00.000Z",
	stripeCustomerId: "cus_test_123",
	billingDetails: null,
	paymentMethod: null,
	upcomingInvoice: null,
	invoices: [],
};

const BILLING_DATA_HOBBY = {
	plan: { tier: "HOBBY", price: null, currency: null, interval: null },
	status: "active",
	cancelAtPeriodEnd: false,
	currentPeriodEnd: null,
	stripeCustomerId: null,
	billingDetails: null,
	paymentMethod: null,
	upcomingInvoice: null,
	invoices: [],
};

type FetchMockOptions = {
	authData?: Record<string, unknown> | null;
	authStatus?: number;
	dashboardData?: Record<string, unknown>;
	billingData?: Record<string, unknown>;
	cancelData?: Record<string, unknown>;
	cancelStatus?: number;
};

function setupFetchMock({
	authData = { email: "alice@example.com", approved: true },
	authStatus = 200,
	dashboardData = DASHBOARD_DATA,
	billingData = BILLING_DATA_PAID,
	cancelData = { message: "Subscription cancelled successfully." },
	cancelStatus = 200,
}: FetchMockOptions = {}) {
	return vi
		.spyOn(globalThis, "fetch")
		.mockImplementation(async (input: RequestInfo | URL) => {
			const url =
				typeof input === "string"
					? input
					: input instanceof URL
						? input.href
						: (input as Request).url;

			if (url.includes("/auth/me")) {
				return authData
					? jsonResponse(authData, authStatus)
					: new Response(null, { status: authStatus });
			}
			if (url.includes("/auth/dashboard")) {
				return jsonResponse(dashboardData);
			}
			if (url.includes("/payments/cancel-subscription")) {
				return jsonResponse(cancelData, cancelStatus);
			}
			if (url.includes("/payments/billing")) {
				return jsonResponse(billingData);
			}
			throw new Error(`Unexpected fetch: ${url}`);
		});
}

describe("BillingPage", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
		process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("shows an AuthGate when the user is not authenticated", () => {
		setupFetchMock({ authData: null, authStatus: 401 });
		render(<BillingPage />);
		expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
	});

	it("shows the hobby plan description when on the HOBBY tier", async () => {
		localStorage.setItem("token", "test-token");
		setupFetchMock({ billingData: BILLING_DATA_HOBBY });
		render(<BillingPage />);
		await waitFor(() => {
			expect(screen.getByText(/free Hobby plan/i)).toBeInTheDocument();
		});
	});

	it("displays the formatted GBP plan price after billing data loads", async () => {
		localStorage.setItem("token", "test-token");
		setupFetchMock({ billingData: BILLING_DATA_PAID });
		render(<BillingPage />);
		await waitFor(() => {
			expect(screen.getByText("£29")).toBeInTheDocument();
		});
	});

	it("shows a success message after the subscription is cancelled", async () => {
		localStorage.setItem("token", "test-token");
		vi.spyOn(window, "confirm").mockReturnValue(true);
		setupFetchMock({
			billingData: BILLING_DATA_PAID,
			cancelData: { message: "Subscription cancelled successfully." },
		});
		render(<BillingPage />);

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: "Cancel subscription" }),
			).not.toBeDisabled();
		});
		fireEvent.click(
			screen.getByRole("button", { name: "Cancel subscription" }),
		);

		await waitFor(() => {
			expect(
				screen.getByText("Subscription cancelled successfully."),
			).toBeInTheDocument();
		});
	});
});
