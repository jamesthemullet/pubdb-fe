import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("/api/payments/[action]", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
		process.env.API_URL = "https://api.example.com";
		process.env.TESTING_API_KEY = "test-key";
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("GET never sends X-API-Key, even when TESTING_API_KEY is set", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ cancelAtPeriodEnd: false }),
		);

		await GET(
			new Request("http://localhost/api/payments/billing", {
				headers: { authorization: "Bearer user-token" },
			}),
			{ params: Promise.resolve({ action: "billing" }) },
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/payments/billing",
			{
				headers: { Authorization: "Bearer user-token" },
				cache: "no-store",
			},
		);
	});

	it("POST never sends X-API-Key, and forwards the request body", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ url: "https://checkout.example.com" }),
		);

		await POST(
			new Request("http://localhost/api/payments/create-checkout-session", {
				method: "POST",
				headers: { authorization: "Bearer user-token" },
				body: JSON.stringify({ priceId: "price_123" }),
			}),
			{ params: Promise.resolve({ action: "create-checkout-session" }) },
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/payments/create-checkout-session",
			{
				method: "POST",
				headers: {
					Authorization: "Bearer user-token",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ priceId: "price_123" }),
			},
		);
	});
});
