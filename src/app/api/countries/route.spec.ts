import { describe, expect, it } from "vitest";
import { COUNTRIES } from "@/data/countries";
import { GET } from "./route";

describe("GET /api/countries", () => {
	it("returns the bundled country list with a Cache-Control header", async () => {
		const response = await GET();

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual(COUNTRIES);
		expect(response.headers.get("Cache-Control")).toMatch(/public/);
		expect(response.headers.get("Cache-Control")).toMatch(/s-maxage=/);
	});

	it("includes an entry for the United Kingdom", async () => {
		const response = await GET();
		const data: typeof COUNTRIES = await response.json();

		expect(data).toContainEqual({ name: { common: "United Kingdom" }, cca2: "GB" });
	});
});
