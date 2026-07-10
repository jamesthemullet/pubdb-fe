import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, GET, PATCH } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("GET /api/pubs/[id]", () => {
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

	it("proxies to the upstream API for the given pub id", async () => {
		const pub = { id: "abc", name: "The Harp" };
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(pub));

		const request = new Request("http://localhost/api/pubs/abc");
		const response = await GET(request, { params: Promise.resolve({ id: "abc" }) });

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/api/v1/pubs/abc",
			expect.objectContaining({ headers: expect.objectContaining({ "X-API-Key": "test-key" }) }),
		);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual(pub);
	});
});

describe("PATCH /api/pubs/[id]", () => {
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

	it("forwards request body and auth header to the upstream API and returns the result", async () => {
		const upstreamData = { id: "42", name: "Updated Pub" };
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(upstreamData, 200));

		const request = new Request("http://localhost/api/pubs/42", {
			method: "PATCH",
			headers: { "Content-Type": "application/json", authorization: "Bearer user-token" },
			body: JSON.stringify({ name: "Updated Pub" }),
		});

		const response = await PATCH(request, { params: Promise.resolve({ id: "42" }) });

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/pubs/42",
			expect.objectContaining({
				method: "PATCH",
				headers: {
					Authorization: "Bearer user-token",
					"Content-Type": "application/json",
				},
			}),
		);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual(upstreamData);
	});

	it("returns 500 with error message when fetch throws", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Connection refused"));

		const request = new Request("http://localhost/api/pubs/99", {
			method: "PATCH",
			body: JSON.stringify({ name: "Boom" }),
		});

		const response = await PATCH(request, { params: Promise.resolve({ id: "99" }) });

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({ error: "Connection refused" });
	});
});

describe("DELETE /api/pubs/[id]", () => {
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

	it("returns a 204 response with no body when the upstream returns 204", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

		const request = new Request("http://localhost/api/pubs/42", {
			method: "DELETE",
			headers: { authorization: "Bearer user-token" },
		});

		const response = await DELETE(request, { params: Promise.resolve({ id: "42" }) });

		expect(response.status).toBe(204);
		expect(await response.text()).toBe("");
	});

	it("returns upstream JSON and status for non-204 responses", async () => {
		const upstreamData = { error: "Not found" };
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(upstreamData, 404));

		const request = new Request("http://localhost/api/pubs/99", { method: "DELETE" });

		const response = await DELETE(request, { params: Promise.resolve({ id: "99" }) });

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual(upstreamData);
	});
});
