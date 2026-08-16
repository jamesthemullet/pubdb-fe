import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("POST /api/auth/keys/[id]/regenerate", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
		process.env.API_URL = "https://api.example.com";
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("forwards POST to the backend with the auth header and URL-encoded id", async () => {
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(jsonResponse({ key: "new-key-value" }));

		const response = await POST(
			new Request("http://localhost/api/auth/keys/key_ab12cd34/regenerate", {
				method: "POST",
				headers: { authorization: "Bearer user-token", "content-type": "application/json" },
				body: JSON.stringify({}),
			}),
			{ params: Promise.resolve({ id: "key_ab12cd34" }) },
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.example.com/auth/keys/key_ab12cd34/regenerate",
			expect.objectContaining({
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: "Bearer user-token" },
			}),
		);
		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ key: "new-key-value" });
	});

	it("propagates a non-ok backend status without throwing", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ error: "Forbidden" }, 403),
		);

		const response = await POST(
			new Request("http://localhost/api/auth/keys/key_bogus/regenerate", {
				method: "POST",
			}),
			{ params: Promise.resolve({ id: "key_bogus" }) },
		);

		expect(response.status).toBe(403);
		await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
	});

	it("returns 500 with the error message when fetch throws", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network failure"));

		const response = await POST(
			new Request("http://localhost/api/auth/keys/key_abc/regenerate", {
				method: "POST",
			}),
			{ params: Promise.resolve({ id: "key_abc" }) },
		);

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({ error: "Network failure" });
	});
});
