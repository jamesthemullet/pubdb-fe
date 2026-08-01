import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/countries", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns country data with a Cache-Control header on success", async () => {
		const payload = [{ name: { common: "United Kingdom" }, cca2: "GB" }];
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify(payload), {
				status: 200,
				headers: { "content-type": "application/json" },
			})
		);

		const response = await GET();

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual(payload);
		expect(response.headers.get("Cache-Control")).toMatch(/public/);
		expect(response.headers.get("Cache-Control")).toMatch(/s-maxage=/);
	});

	it("returns an error JSON with the upstream status when upstream is not ok", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ message: "Service Unavailable" }), {
				status: 503,
				headers: { "content-type": "application/json" },
			})
		);

		const response = await GET();

		expect(response.status).toBe(503);
		await expect(response.json()).resolves.toEqual({ error: "Failed to fetch countries" });
	});

	it("returns 502 with an error JSON when fetch throws", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

		const response = await GET();

		expect(response.status).toBe(502);
		await expect(response.json()).resolves.toEqual({ error: "Failed to fetch countries" });
	});
});
