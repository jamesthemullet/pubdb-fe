"use client";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "recentSearches";
export const MAX_RECENT_SEARCHES = 8;
const MIN_RECENT_SEARCH_LENGTH = 2;

function readStoredSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

function writeStoredSearches(searches: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  } catch {
    // Storage may be unavailable (private mode, quota) — recents are best-effort.
  }
}

export function addToRecentSearches(current: string[], term: string): string[] {
  const trimmed = term.trim();
  if (trimmed.length < MIN_RECENT_SEARCH_LENGTH) return current;
  const lower = trimmed.toLowerCase();
  const withoutDuplicate = current.filter((s) => s.toLowerCase() !== lower);
  // If the latest entry was a partial of this term (e.g. "kens" then
  // "kensington" after a typing pause), replace it rather than keep both.
  const [latest, ...rest] = withoutDuplicate;
  const deduped =
    latest !== undefined && lower.startsWith(latest.toLowerCase())
      ? rest
      : withoutDuplicate;
  return [trimmed, ...deduped].slice(0, MAX_RECENT_SEARCHES);
}

export function useRecentSearches(): {
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
} {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(readStoredSearches());
  }, []);

  const update = useCallback((fn: (prev: string[]) => string[]) => {
    setRecentSearches((prev) => {
      const next = fn(prev);
      if (next !== prev) writeStoredSearches(next);
      return next;
    });
  }, []);

  const addRecentSearch = useCallback(
    (term: string) => update((prev) => addToRecentSearches(prev, term)),
    [update]
  );

  const removeRecentSearch = useCallback(
    (term: string) => update((prev) => prev.filter((s) => s !== term)),
    [update]
  );

  const clearRecentSearches = useCallback(() => update(() => []), [update]);

  return { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches };
}
