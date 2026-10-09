"use client";
import { useCallback, useEffect, useState } from "react";
import {
  type SavedSearch,
  type SavedSearchParams,
  savedSearchErrorMessage,
} from "@/lib/savedSearches";

const ENDPOINT = "/api/auth/me/saved-searches";

export type SavedSearchResult = { ok: true } | { ok: false; error: string };

function isSavedSearch(item: unknown): item is SavedSearch {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.params === "object" &&
    obj.params !== null
  );
}

async function request(
  url: string,
  init: RequestInit,
  fallback: string
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, init);
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: savedSearchErrorMessage(data, fallback) };
    return { ok: true, data };
  } catch {
    return { ok: false, error: fallback };
  }
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

/** The logged-in user's saved searches. Does nothing while `enabled` is false. */
export function useSavedSearches(enabled: boolean): {
  savedSearches: SavedSearch[];
  savedSearchesLoading: boolean;
  savedSearchesError: string | null;
  createSavedSearch: (name: string, params: SavedSearchParams) => Promise<SavedSearchResult>;
  renameSavedSearch: (id: string, name: string) => Promise<SavedSearchResult>;
  deleteSavedSearch: (id: string) => Promise<SavedSearchResult>;
} {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [savedSearchesLoading, setSavedSearchesLoading] = useState(false);
  const [savedSearchesError, setSavedSearchesError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSavedSearches([]);
      return;
    }
    let ignore = false;
    setSavedSearchesLoading(true);
    setSavedSearchesError(null);
    request(ENDPOINT, {}, "Unable to load saved searches.").then((result) => {
      if (ignore) return;
      if (result.ok) {
        const list = (result.data as { savedSearches?: unknown } | null)?.savedSearches;
        setSavedSearches(Array.isArray(list) ? list.filter(isSavedSearch) : []);
      } else {
        setSavedSearchesError(result.error);
      }
      setSavedSearchesLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [enabled]);

  const createSavedSearch = useCallback(
    async (name: string, params: SavedSearchParams): Promise<SavedSearchResult> => {
      const result = await request(
        ENDPOINT,
        jsonInit("POST", { name, params }),
        "Couldn't save this search."
      );
      if (!result.ok) return result;
      const created = (result.data as { savedSearch?: unknown } | null)?.savedSearch;
      if (isSavedSearch(created)) setSavedSearches((prev) => [created, ...prev]);
      return { ok: true };
    },
    []
  );

  const renameSavedSearch = useCallback(
    async (id: string, name: string): Promise<SavedSearchResult> => {
      const result = await request(
        `${ENDPOINT}/${encodeURIComponent(id)}`,
        jsonInit("PATCH", { name }),
        "Couldn't rename this search."
      );
      if (!result.ok) return result;
      const updated = (result.data as { savedSearch?: unknown } | null)?.savedSearch;
      if (isSavedSearch(updated)) {
        setSavedSearches((prev) => prev.map((s) => (s.id === id ? updated : s)));
      }
      return { ok: true };
    },
    []
  );

  const deleteSavedSearch = useCallback(async (id: string): Promise<SavedSearchResult> => {
    const result = await request(
      `${ENDPOINT}/${encodeURIComponent(id)}`,
      { method: "DELETE" },
      "Couldn't delete this search."
    );
    if (!result.ok) return result;
    setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    return { ok: true };
  }, []);

  return {
    savedSearches,
    savedSearchesLoading,
    savedSearchesError,
    createSavedSearch,
    renameSavedSearch,
    deleteSavedSearch,
  };
}
