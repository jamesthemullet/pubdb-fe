import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("/api/auth/[action]", () => {
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
			jsonResponse({ apiKeys: [] }),
		);

		await GET(
			new Request("http://localhost/api/auth/dashboard", {
				headers: { authorization: "Bearer user-token" },
			}),
			{ params: Promise.resolve({ action: "dashboard" }) },
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/auth/dashboard",
			{
				headers: { Authorization: "Bearer user-token" },
				cache: "no-store",
			},
		);
	});

	it("POST never sends X-API-Key, and forwards the request body", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ token: "abc" }),
		);

		await POST(
			new Request("http://localhost/api/auth/login", {
				method: "POST",
				body: JSON.stringify({ email: "a@b.com", password: "secret" }),
			}),
			{ params: Promise.resolve({ action: "login" }) },
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/auth/login",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: "a@b.com", password: "secret" }),
			},
		);
	});
});
