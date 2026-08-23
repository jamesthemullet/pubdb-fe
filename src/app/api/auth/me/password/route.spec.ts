import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("PATCH /api/auth/me/password", () => {
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

	it("forwards the body and Authorization header to the upstream API", async () => {
		const responsePayload = { message: "Password updated" };
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(jsonResponse(responsePayload));

		const body = JSON.stringify({ currentPassword: "old", newPassword: "new" });
		const request = new Request("http://localhost/api/auth/me/password", {
			method: "PATCH",
			headers: { cookie: "auth-token=user-token", "content-type": "application/json" },
			body,
		});

		const response = await PATCH(request);

		expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/auth/me/password", {
			method: "PATCH",
			headers: { "Content-Type": "application/json", Authorization: "Bearer user-token" },
			body,
		});
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual(responsePayload);
	});

	it("returns 500 with the error message when fetch throws", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network failure"));

		const request = new Request("http://localhost/api/auth/me/password", {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ currentPassword: "old", newPassword: "new" }),
		});

		const response = await PATCH(request);

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({ error: "Network failure" });
	});
});
