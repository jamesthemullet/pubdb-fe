import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, PATCH } from "./[id]/route";
import { GET, POST } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("/api/auth/me/saved-searches", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
		process.env.API_URL = "https://api.example.com";
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("forwards GET with the auth header from the cookie", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(jsonResponse({ savedSearches: [] }));

		const response = await GET(
			new Request("http://localhost/api/auth/me/saved-searches", {
				headers: { cookie: "auth-token=user-token" },
			}),
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/auth/me/saved-searches",
			{
				method: "GET",
				headers: { Authorization: "Bearer user-token" },
				cache: "no-store",
			},
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ savedSearches: [] });
	});

	it("forwards the POST body and passes the backend status through", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(jsonResponse({ error: "Name already used" }, 409));
		const body = JSON.stringify({ name: "CR0", params: { search: "CR0" } });

		const response = await POST(
			new Request("http://localhost/api/auth/me/saved-searches", {
				method: "POST",
				headers: { cookie: "auth-token=user-token" },
				body,
			}),
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/auth/me/saved-searches",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer user-token",
				},
				body,
				cache: "no-store",
			},
		);
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ error: "Name already used" });
	});

	it("forwards PATCH and DELETE to the encoded id", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockImplementation(async () => jsonResponse({ success: true }));
		const context = { params: Promise.resolve({ id: "a/b" }) };

		await PATCH(
			new Request("http://localhost/api/auth/me/saved-searches/a%2Fb", {
				method: "PATCH",
				body: JSON.stringify({ name: "New" }),
			}),
			context,
		);
		await DELETE(
			new Request("http://localhost/api/auth/me/saved-searches/a%2Fb", {
				method: "DELETE",
			}),
			context,
		);

		const calls = fetchMock.mock.calls.map(([url, init]) => [
			url,
			(init as RequestInit).method,
		]);
		expect(calls).toEqual([
			["https://api.example.com/auth/me/saved-searches/a%2Fb", "PATCH"],
			["https://api.example.com/auth/me/saved-searches/a%2Fb", "DELETE"],
		]);
	});

	it("returns 500 when the backend is unreachable", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

		const response = await GET(
			new Request("http://localhost/api/auth/me/saved-searches"),
		);

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: "ECONNREFUSED" });
	});
});
