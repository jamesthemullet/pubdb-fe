import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  addToRecentSearches,
  MAX_RECENT_SEARCHES,
  useRecentSearches,
} from "./useRecentSearches";

describe("addToRecentSearches", () => {
  it("adds a new term to the front", () => {
    expect(addToRecentSearches(["CR0"], "Kensington")).toEqual([
      "Kensington",
      "CR0",
    ]);
  });

  it("trims whitespace and ignores terms that are too short", () => {
    expect(addToRecentSearches([], "  Kensington  ")).toEqual(["Kensington"]);
    expect(addToRecentSearches(["CR0"], "k")).toEqual(["CR0"]);
    expect(addToRecentSearches(["CR0"], "   ")).toEqual(["CR0"]);
  });

  it("moves a case-insensitive duplicate to the front", () => {
    expect(addToRecentSearches(["CR0", "kensington"], "Kensington")).toEqual([
      "Kensington",
      "CR0",
    ]);
  });

  it("replaces the latest entry when the new term extends it", () => {
    expect(addToRecentSearches(["kens", "CR0"], "Kensington")).toEqual([
      "Kensington",
      "CR0",
    ]);
  });

  it("keeps older entries that happen to be prefixes", () => {
    expect(addToRecentSearches(["CR0", "the"], "the crown")).toEqual([
      "the crown",
      "CR0",
      "the",
    ]);
  });

  it("caps the list length", () => {
    const full = Array.from({ length: MAX_RECENT_SEARCHES }, (_, i) => `term${i}`);
    const next = addToRecentSearches(full, "newest");
    expect(next).toHaveLength(MAX_RECENT_SEARCHES);
    expect(next[0]).toBe("newest");
    expect(next).not.toContain(`term${MAX_RECENT_SEARCHES - 1}`);
  });
});

describe("useRecentSearches", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("defaults to an empty list", () => {
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.recentSearches).toEqual([]);
  });

  it("reads stored searches on mount", () => {
    localStorage.setItem("recentSearches", JSON.stringify(["CR0", "Kensington"]));
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.recentSearches).toEqual(["CR0", "Kensington"]);
  });

  it("ignores malformed stored data", () => {
    localStorage.setItem("recentSearches", "{not json");
    const { result } = renderHook(() => useRecentSearches());
    expect(result.current.recentSearches).toEqual([]);
  });

  it("adds, removes and clears searches, persisting each change", () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => result.current.addRecentSearch("Kensington"));
    act(() => result.current.addRecentSearch("CR0"));
    expect(result.current.recentSearches).toEqual(["CR0", "Kensington"]);
    expect(JSON.parse(localStorage.getItem("recentSearches") ?? "[]")).toEqual([
      "CR0",
      "Kensington",
    ]);

    act(() => result.current.removeRecentSearch("CR0"));
    expect(result.current.recentSearches).toEqual(["Kensington"]);

    act(() => result.current.clearRecentSearches());
    expect(result.current.recentSearches).toEqual([]);
    expect(localStorage.getItem("recentSearches")).toBe("[]");
  });
});
