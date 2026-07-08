import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("GET /api/auth/me", () => {
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

	it("forwards the caller's Authorization header to the upstream API", async () => {
		const payload = { email: "alice@example.com", approved: true, admin: false };
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(payload));

		const request = new Request("http://localhost/api/auth/me", {
			headers: { authorization: "Bearer user-token" },
		});

		const response = await GET(request);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/auth/me",
			{
				headers: { Authorization: "Bearer user-token" },
				cache: "no-store",
			},
		);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual(payload);
	});

	it("omits Authorization when the caller sends no token", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 401));

		await GET(new Request("http://localhost/api/auth/me"));

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/auth/me",
			{ headers: {}, cache: "no-store" },
		);
	});
});
