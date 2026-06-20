import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useContributions } from "./useContributions";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("useContributions", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("starts in loading state with no data or error", () => {
		vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));

		const { result } = renderHook(() => useContributions());

		expect(result.current.contributionsLoading).toBe(true);
		expect(result.current.contributions).toBeNull();
		expect(result.current.contributionsError).toBeNull();
	});

	it("returns normalized contributions with grouped edits after a successful fetch", async () => {
		const payload = {
			totalAdded: 3,
			recentPubs: [
				{ id: "p1", name: "The Crown", city: "London", createdAt: "2026-01-01" },
			],
			recentEdits: [
				{
					pubId: "p1",
					pubName: "The Crown",
					city: "London",
					editTypes: ["name"],
					timestamp: "2026-01-02",
				},
				{
					pubId: "p1",
					pubName: "The Crown",
					city: "London",
					editTypes: ["address", "name"],
					timestamp: "2026-01-03",
				},
				{
					pubId: "p2",
					pubName: "The Lion",
					city: "Manchester",
					editTypes: ["description"],
					timestamp: "2026-01-04",
				},
			],
		};
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(payload));

		const { result } = renderHook(() => useContributions());
		await waitFor(() => expect(result.current.contributionsLoading).toBe(false));

		expect(result.current.contributions?.totalAdded).toBe(3);
		expect(result.current.contributions?.recentPubs).toEqual(payload.recentPubs);

		const editsByPub = result.current.contributions?.editsByPub ?? [];
		expect(editsByPub).toHaveLength(2);

		const p1 = editsByPub.find((e) => e.pubId === "p1");
		expect(p1?.editCount).toBe(2);
		// "name" appears in both edits but should only be listed once
		expect(p1?.editTypes).toEqual(expect.arrayContaining(["name", "address"]));
		expect(p1?.editTypes).toHaveLength(2);

		expect(result.current.contributionsError).toBeNull();
	});

	it("sets error and clears loading on non-ok response", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ error: "Forbidden" }, 403),
		);

		const { result } = renderHook(() => useContributions());
		await waitFor(() => expect(result.current.contributionsLoading).toBe(false));

		expect(result.current.contributionsError).toMatch(/Failed to fetch contributions: 403/);
		expect(result.current.contributions).toBeNull();
	});

	it("sends Authorization header when a token is in localStorage", async () => {
		localStorage.setItem("token", "my-token");
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ totalAdded: 0, recentPubs: [], recentEdits: [] }),
		);

		const { result } = renderHook(() => useContributions());
		await waitFor(() => expect(result.current.contributionsLoading).toBe(false));

		expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
			"/api/contributions",
			expect.objectContaining({
				headers: { Authorization: "Bearer my-token" },
			}),
		);
	});
});
