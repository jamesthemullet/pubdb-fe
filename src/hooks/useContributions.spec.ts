import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useContributions } from "./useContributions";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

const VALID_RECENT_PUB = {
	id: "pub-1",
	name: "The Crown",
	city: "London",
	createdAt: "2026-01-01T00:00:00Z",
};

const VALID_EDIT_A = {
	pubId: "pub-1",
	pubName: "The Crown",
	city: "London",
	editTypes: ["name"],
	timestamp: "2026-01-02T00:00:00Z",
};

const VALID_EDIT_B = {
	pubId: "pub-1",
	pubName: "The Crown",
	city: "London",
	editTypes: ["address"],
	timestamp: "2026-01-03T00:00:00Z",
};

const VALID_EDIT_C = {
	pubId: "pub-2",
	pubName: "The Harp",
	city: "Bristol",
	editTypes: ["name", "city"],
	timestamp: "2026-01-04T00:00:00Z",
};

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

	it("returns normalized contributions after a successful fetch", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ totalAdded: 5, recentPubs: [VALID_RECENT_PUB], recentEdits: [] }),
		);
		const { result } = renderHook(() => useContributions());
		await waitFor(() => expect(result.current.contributionsLoading).toBe(false));
		expect(result.current.contributionsError).toBeNull();
		expect(result.current.contributions?.totalAdded).toBe(5);
		expect(result.current.contributions?.recentPubs).toHaveLength(1);
		expect(result.current.contributions?.recentPubs[0].name).toBe("The Crown");
	});

	it("sets an error when the response status is not ok", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 500));
		const { result } = renderHook(() => useContributions());
		await waitFor(() => expect(result.current.contributionsLoading).toBe(false));
		expect(result.current.contributionsError).toMatch(/Failed to fetch contributions/);
		expect(result.current.contributions).toBeNull();
	});

	it("sets an error when fetch throws", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network failure"));
		const { result } = renderHook(() => useContributions());
		await waitFor(() => expect(result.current.contributionsLoading).toBe(false));
		expect(result.current.contributionsError).toBe("Network failure");
		expect(result.current.contributions).toBeNull();
	});

	describe("normalizeContributions", () => {
		it("filters out recentPubs missing required fields", async () => {
			const invalidPub = { id: "pub-1", name: "The Crown" }; // missing city and createdAt
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ totalAdded: 1, recentPubs: [VALID_RECENT_PUB, invalidPub], recentEdits: [] }),
			);
			const { result } = renderHook(() => useContributions());
			await waitFor(() => expect(result.current.contributionsLoading).toBe(false));
			expect(result.current.contributions?.recentPubs).toHaveLength(1);
			expect(result.current.contributions?.recentPubs[0].id).toBe("pub-1");
		});

		it("filters out recentEdits missing required fields", async () => {
			const invalidEdit = { pubId: "pub-1", pubName: "The Crown" }; // missing city and editTypes
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ totalAdded: 0, recentPubs: [], recentEdits: [VALID_EDIT_A, invalidEdit] }),
			);
			const { result } = renderHook(() => useContributions());
			await waitFor(() => expect(result.current.contributionsLoading).toBe(false));
			// Only the one valid edit contributes to editsByPub
			expect(result.current.contributions?.editsByPub).toHaveLength(1);
		});

		it("defaults totalAdded to 0 when missing from payload", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ recentPubs: [], recentEdits: [] }),
			);
			const { result } = renderHook(() => useContributions());
			await waitFor(() => expect(result.current.contributionsLoading).toBe(false));
			expect(result.current.contributions?.totalAdded).toBe(0);
		});

		it("returns empty collections when payload is not an object", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(null));
			const { result } = renderHook(() => useContributions());
			await waitFor(() => expect(result.current.contributionsLoading).toBe(false));
			expect(result.current.contributions).toEqual({
				totalAdded: 0,
				recentPubs: [],
				editsByPub: [],
			});
		});
	});

	describe("groupEditsByPub", () => {
		it("groups multiple edits for the same pub into one entry with combined editCount", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ totalAdded: 0, recentPubs: [], recentEdits: [VALID_EDIT_A, VALID_EDIT_B] }),
			);
			const { result } = renderHook(() => useContributions());
			await waitFor(() => expect(result.current.contributionsLoading).toBe(false));
			expect(result.current.contributions?.editsByPub).toHaveLength(1);
			expect(result.current.contributions?.editsByPub[0].editCount).toBe(2);
		});

		it("deduplicates editTypes when merging edits for the same pub", async () => {
			const editWithDupe = { ...VALID_EDIT_B, editTypes: ["name", "address"] };
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ totalAdded: 0, recentPubs: [], recentEdits: [VALID_EDIT_A, editWithDupe] }),
			);
			const { result } = renderHook(() => useContributions());
			await waitFor(() => expect(result.current.contributionsLoading).toBe(false));
			const editsByPub = result.current.contributions?.editsByPub[0];
			// VALID_EDIT_A has ["name"], editWithDupe adds ["name", "address"]; "name" should not be duplicated
			expect(editsByPub?.editTypes).toEqual(expect.arrayContaining(["name", "address"]));
			expect(editsByPub?.editTypes).toHaveLength(2);
		});

		it("creates separate entries for edits on different pubs", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ totalAdded: 0, recentPubs: [], recentEdits: [VALID_EDIT_A, VALID_EDIT_C] }),
			);
			const { result } = renderHook(() => useContributions());
			await waitFor(() => expect(result.current.contributionsLoading).toBe(false));
			expect(result.current.contributions?.editsByPub).toHaveLength(2);
		});

		it("preserves pubName and city from the first edit when grouping", async () => {
			vi.spyOn(globalThis, "fetch").mockResolvedValue(
				jsonResponse({ totalAdded: 0, recentPubs: [], recentEdits: [VALID_EDIT_A, VALID_EDIT_B] }),
			);
			const { result } = renderHook(() => useContributions());
			await waitFor(() => expect(result.current.contributionsLoading).toBe(false));
			const entry = result.current.contributions?.editsByPub[0];
			expect(entry?.pubName).toBe("The Crown");
			expect(entry?.city).toBe("London");
		});
	});

	it("sends Authorization header when token is in localStorage", async () => {
		localStorage.setItem("token", "test-token");
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ totalAdded: 0, recentPubs: [], recentEdits: [] }),
		);
		const { result } = renderHook(() => useContributions());
		await waitFor(() => expect(result.current.contributionsLoading).toBe(false));
		expect(fetchSpy).toHaveBeenCalledWith(
			"/api/contributions",
			expect.objectContaining({ headers: { Authorization: "Bearer test-token" } }),
		);
	});

	it("omits Authorization header when no token is present", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ totalAdded: 0, recentPubs: [], recentEdits: [] }),
		);
		const { result } = renderHook(() => useContributions());
		await waitFor(() => expect(result.current.contributionsLoading).toBe(false));
		expect(fetchSpy).toHaveBeenCalledWith(
			"/api/contributions",
			expect.objectContaining({ headers: {} }),
		);
	});
});
