import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/leaderboard", () => {
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

	it("proxies to the leaderboard endpoint and returns a successful response", async () => {
		const payload = { data: { leaderboard: [], since: null, generatedAt: "" } };
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify(payload), {
				status: 200,
				headers: { "content-type": "application/json" },
			})
		);

		const response = await GET(new Request("http://localhost/api/leaderboard"));

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/api/v1/contributors/leaderboard",
			expect.objectContaining({ headers: expect.objectContaining({ "X-API-Key": "test-key" }) })
		);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual(payload);
	});

	it("does not forward an Authorization header (no forwardAuth)", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({}), { status: 200 })
		);

		await GET(
			new Request("http://localhost/api/leaderboard", {
				headers: { authorization: "Bearer user-token" },
			})
		);

		const calledHeaders = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
		expect(calledHeaders.Authorization).toBeUndefined();
	});

	it("returns 500 when the upstream fetch throws", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network failure"));

		const response = await GET(new Request("http://localhost/api/leaderboard"));

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({ error: "Internal server error" });
	});
});
