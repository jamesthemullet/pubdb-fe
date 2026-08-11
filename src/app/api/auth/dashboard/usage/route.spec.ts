import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("/api/auth/dashboard/usage", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
		process.env.API_URL = "https://api.example.com";
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("forwards the range query param and Authorization header to the backend", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ range: "7d", bucket: "day", series: [] }),
		);

		await GET(
			new Request("http://localhost/api/auth/dashboard/usage?range=7d", {
				headers: { authorization: "Bearer user-token" },
			}),
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/auth/dashboard/usage?range=7d",
			{
				headers: { Authorization: "Bearer user-token" },
				cache: "no-store",
			},
		);
	});

	it("defaults to a 30d range when none is provided", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ range: "30d", bucket: "day", series: [] }),
		);

		await GET(new Request("http://localhost/api/auth/dashboard/usage"));

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/auth/dashboard/usage?range=30d",
			{
				headers: {},
				cache: "no-store",
			},
		);
	});
});
