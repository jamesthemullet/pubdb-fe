import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearBeerTypesCache, useBeerTypes } from "./useBeerTypes";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

describe("useBeerTypes", () => {
	beforeEach(() => {
		clearBeerTypesCache();
	});

	afterEach(() => {
		clearBeerTypesCache();
		vi.restoreAllMocks();
	});

	it("starts loading when no cache exists", () => {
		vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));

		const { result } = renderHook(() => useBeerTypes());

		expect(result.current.beerTypesLoading).toBe(true);
		expect(result.current.beerTypeOptions).toEqual([]);
		expect(result.current.beerTypesError).toBeNull();
	});

	it("returns sorted and filtered active beer types after fetch", async () => {
		const payload = [
			{ id: "3", name: "Stout", isActive: true },
			{ id: "1", name: "Ale", isActive: true },
			{ id: "2", name: "Lager", isActive: false },
		];
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(payload));

		const { result } = renderHook(() => useBeerTypes());

		await waitFor(() => expect(result.current.beerTypesLoading).toBe(false));

		expect(result.current.beerTypeOptions).toEqual([
			{ id: "1", name: "Ale", isActive: true },
			{ id: "3", name: "Stout", isActive: true },
		]);
		expect(result.current.beerTypesError).toBeNull();
	});

	it("handles payload wrapped in data property", async () => {
		const payload = { data: [{ id: "1", name: "IPA", isActive: true }] };
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(payload));

		const { result } = renderHook(() => useBeerTypes());

		await waitFor(() => expect(result.current.beerTypesLoading).toBe(false));

		expect(result.current.beerTypeOptions).toEqual([
			{ id: "1", name: "IPA", isActive: true },
		]);
	});

	it("sets error and stops loading when fetch returns non-ok status", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ error: "Unauthorized" }, 401),
		);

		const { result } = renderHook(() => useBeerTypes());

		await waitFor(() => expect(result.current.beerTypesLoading).toBe(false));

		expect(result.current.beerTypesError).toMatch(/Failed to fetch beer types/);
		expect(result.current.beerTypeOptions).toEqual([]);
	});

	it("sets error when fetch throws", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(
			new Error("Network failure"),
		);

		const { result } = renderHook(() => useBeerTypes());

		await waitFor(() => expect(result.current.beerTypesLoading).toBe(false));

		expect(result.current.beerTypesError).toBe("Network failure");
		expect(result.current.beerTypeOptions).toEqual([]);
	});

	it("returns cached beer types immediately on subsequent mounts without fetching", async () => {
		const payload = [{ id: "1", name: "Ale", isActive: true }];
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(jsonResponse(payload));

		const { result: first } = renderHook(() => useBeerTypes());
		await waitFor(() => expect(first.current.beerTypesLoading).toBe(false));

		expect(fetchMock).toHaveBeenCalledTimes(1);

		const { result: second } = renderHook(() => useBeerTypes());

		expect(second.current.beerTypesLoading).toBe(false);
		expect(second.current.beerTypeOptions).toEqual([
			{ id: "1", name: "Ale", isActive: true },
		]);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("fetches beer types from the proxy route without an auth header", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));

		const { result } = renderHook(() => useBeerTypes());

		await waitFor(() => expect(result.current.beerTypesLoading).toBe(false));

		expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith("/api/beer-types");
	});
});
