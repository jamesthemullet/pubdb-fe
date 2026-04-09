import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearCountriesCache, useCountries } from "./useCountries";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("useCountries", () => {
  beforeEach(() => {
    clearCountriesCache();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    clearCountriesCache();
    vi.restoreAllMocks();
  });

  it("starts with an empty countries list and loading true", () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCountries());

    expect(result.current.countries).toEqual([]);
    expect(result.current.countriesLoading).toBe(true);
  });

  it("returns sorted countries after a successful fetch", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse([
        { name: { common: "Zimbabwe" }, cca2: "ZW" },
        { name: { common: "Australia" }, cca2: "AU" },
        { name: { common: "France" }, cca2: "FR" },
      ])
    );

    const { result } = renderHook(() => useCountries());

    await waitFor(() => expect(result.current.countriesLoading).toBe(false));

    expect(result.current.countries).toEqual([
      { name: "Australia", code: "AU" },
      { name: "France", code: "FR" },
      { name: "Zimbabwe", code: "ZW" },
    ]);
  });

  it("sets loading to false and leaves countries empty when fetch returns non-ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "Server error" }, 500)
    );

    const { result } = renderHook(() => useCountries());

    await waitFor(() => expect(result.current.countriesLoading).toBe(false));

    expect(result.current.countries).toEqual([]);
  });

  it("sets loading to false and leaves countries empty when fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCountries());

    await waitFor(() => expect(result.current.countriesLoading).toBe(false));

    expect(result.current.countries).toEqual([]);
  });

  it("returns cached countries immediately on subsequent mounts without fetching", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse([
        { name: { common: "Australia" }, cca2: "AU" },
        { name: { common: "France" }, cca2: "FR" },
      ])
    );

    // First mount — populates the cache
    const { result: first } = renderHook(() => useCountries());
    await waitFor(() => expect(first.current.countriesLoading).toBe(false));

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    // Second mount — should use cache, no new fetch
    const { result: second } = renderHook(() => useCountries());

    expect(second.current.countriesLoading).toBe(false);
    expect(second.current.countries).toEqual([
      { name: "Australia", code: "AU" },
      { name: "France", code: "FR" },
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
