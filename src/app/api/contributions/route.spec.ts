import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/contributions", () => {
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

	it("proxies to the contributions endpoint and returns a successful response", async () => {
		const payload = { data: { totalAdded: 3, recentPubs: [], editsByPub: [] } };
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify(payload), {
				status: 200,
				headers: { "content-type": "application/json" },
			})
		);

		const response = await GET(
			new Request("http://localhost/api/contributions", {
				headers: { authorization: "Bearer user-token" },
			})
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/api/v1/auth/contributions",
			expect.objectContaining({
				headers: expect.objectContaining({ Authorization: "Bearer user-token" }),
			})
		);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual(payload);
	});

	it("forwards the Authorization header from the incoming request", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({}), { status: 200 })
		);

		await GET(
			new Request("http://localhost/api/contributions", {
				headers: { authorization: "Bearer my-secret-token" },
			})
		);

		expect(fetchMock).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				headers: expect.objectContaining({ Authorization: "Bearer my-secret-token" }),
			})
		);
	});

	it("returns 500 when the upstream fetch throws", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network failure"));

		const response = await GET(new Request("http://localhost/api/contributions"));

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({ error: "Internal server error" });
	});
});
