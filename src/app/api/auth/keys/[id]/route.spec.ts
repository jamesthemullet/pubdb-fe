import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("/api/auth/keys/[id]", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
		process.env.API_URL = "https://api.example.com";
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("forwards DELETE to the backend with the auth header and encoded id", async () => {
		const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ success: true }),
		);

		const response = await DELETE(
			new Request("http://localhost/api/auth/keys/key_ab12cd34", {
				method: "DELETE",
				headers: { authorization: "Bearer user-token" },
			}),
			{ params: Promise.resolve({ id: "key_ab12cd34" }) },
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/auth/keys/key_ab12cd34",
			{
				method: "DELETE",
				headers: { Authorization: "Bearer user-token" },
			},
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ success: true });
	});

	it("propagates the backend error status", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ error: "Not found" }, 404),
		);

		const response = await DELETE(
			new Request("http://localhost/api/auth/keys/key_bogus", {
				method: "DELETE",
			}),
			{ params: Promise.resolve({ id: "key_bogus" }) },
		);

		expect(response.status).toBe(404);
	});
});
