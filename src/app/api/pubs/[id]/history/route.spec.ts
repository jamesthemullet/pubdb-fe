import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("GET /api/pubs/[id]/history", () => {
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

	it("proxies to the upstream history endpoint for the given pub id", async () => {
		const history = [{ id: "h1", actor: "alex.k", action: "updated", createdAt: "2026-01-01T00:00:00Z" }];
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(history));

		const request = new Request("http://localhost/api/pubs/abc/history");
		const response = await GET(request, { params: Promise.resolve({ id: "abc" }) });

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/api/v1/pubs/abc/history",
			expect.objectContaining({ headers: expect.objectContaining({ "X-API-Key": "test-key" }) }),
		);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual(history);
	});

	it("forwards the authorization header when present", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));

		const request = new Request("http://localhost/api/pubs/abc/history", {
			headers: { cookie: "auth-token=user-token" },
		});
		await GET(request, { params: Promise.resolve({ id: "abc" }) });

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/api/v1/pubs/abc/history",
			expect.objectContaining({
				headers: expect.objectContaining({ Authorization: "Bearer user-token" }),
			}),
		);
	});
});
