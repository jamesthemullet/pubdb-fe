import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PATCH } from "./route";

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

describe("PATCH /api/auth/me", () => {
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

	it("forwards the caller's Authorization header and body to the upstream API", async () => {
		const payload = {
			id: "1",
			name: "Jane Doe",
			username: "newname",
			email: "jane@example.com",
			image: "https://example.com/avatar.png",
			location: "London",
			bio: "Pub enthusiast",
			approved: true,
			emailVerified: true,
		};
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(payload));

		const request = new Request("http://localhost/api/auth/me", {
			method: "PATCH",
			headers: { authorization: "Bearer user-token", "content-type": "application/json" },
			body: JSON.stringify({ name: "Jane Doe" }),
		});

		const response = await PATCH(request);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/auth/me",
			{
				method: "PATCH",
				headers: { "Content-Type": "application/json", Authorization: "Bearer user-token" },
				body: JSON.stringify({ name: "Jane Doe" }),
			},
		);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual(payload);
	});

	it("returns 400 with the upstream validation error body", async () => {
		const errorPayload = { errors: { fieldErrors: { name: ["Too short"] } } };
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(errorPayload, 400));

		const request = new Request("http://localhost/api/auth/me", {
			method: "PATCH",
			headers: { authorization: "Bearer user-token" },
			body: JSON.stringify({ name: "J" }),
		});

		const response = await PATCH(request);

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual(errorPayload);
	});

	it("returns 409 when the username is already taken", async () => {
		const errorPayload = { error: "Username already taken" };
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(errorPayload, 409));

		const request = new Request("http://localhost/api/auth/me", {
			method: "PATCH",
			headers: { authorization: "Bearer user-token" },
			body: JSON.stringify({ username: "taken" }),
		});

		const response = await PATCH(request);

		expect(response.status).toBe(409);
		await expect(response.json()).resolves.toEqual(errorPayload);
	});
});
