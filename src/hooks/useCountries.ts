'use client';

import { useEffect, useState } from "react";

export type CountryOption = {
  name: string;
  code: string;
};

type RestCountryResponse = {
  name: {
    common: string;
  };
  cca2: string;
};

const STORAGE_KEY = "pubdb_countries_cache";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const FETCH_TIMEOUT_MS = 5000;

// Module-level memory cache: avoids re-parsing localStorage on every mount
// within the same session.
let countriesCache: CountryOption[] | null = null;

// Module-level in-flight request: dedupes concurrent fetches (e.g. React
// Strict Mode's double effect invocation, or multiple components mounting
// useCountries before the cache is populated) so only one network request
// is ever sent to the upstream countries endpoint at a time.
let inFlightRequest: Promise<CountryOption[]> | null = null;

/** Reset the in-memory cache, in-flight request, and localStorage cache. Exposed for testing only. */
export function clearCountriesCache(): void {
  countriesCache = null;
  inFlightRequest = null;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable — ignore
    }
  }
}

type StoredCache = { data: CountryOption[]; timestamp: number };

function isStoredCache(value: unknown): value is StoredCache {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.timestamp === "number" &&
    Array.isArray(obj.data) &&
    obj.data.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).name === "string" &&
        typeof (item as Record<string, unknown>).code === "string"
    )
  );
}

function readStorageCache(): CountryOption[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredCache(parsed)) return null;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeStorageCache(data: CountryOption[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

function getOrFetchCountries(): Promise<CountryOption[]> {
  if (inFlightRequest !== null) {
    return inFlightRequest;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const request = (async (): Promise<CountryOption[]> => {
    try {
      const res = await fetch("/api/countries", {
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch countries: ${res.status}`);
      }

      const data: RestCountryResponse[] = await res.json();
      const options = data
        .map((country) => ({
          name: country.name.common,
          code: country.cca2,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      countriesCache = options;
      writeStorageCache(options);
      return options;
    } finally {
      clearTimeout(timeoutId);
    }
  })();

  inFlightRequest = request;
  return request.finally(() => {
    inFlightRequest = null;
  });
}

export function useCountries(): { countries: CountryOption[]; countriesLoading: boolean; countriesError: string | null } {
  const [countries, setCountries] = useState<CountryOption[]>(
    countriesCache ?? []
  );
  const [countriesLoading, setCountriesLoading] = useState(
    countriesCache === null
  );
  const [countriesError, setCountriesError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Memory cache hit (same session, already fetched)
    if (countriesCache !== null) {
      setCountries(countriesCache);
      setCountriesLoading(false);
      return;
    }

    // 2. localStorage cache hit (persisted from a previous session)
    const stored = readStorageCache();
    if (stored !== null) {
      countriesCache = stored;
      setCountries(stored);
      setCountriesLoading(false);
      return;
    }

    // 3. Network fetch, deduped against any already in-flight request
    let ignore = false;

    async function fetchCountries(): Promise<void> {
      setCountriesLoading(true);
      try {
        const options = await getOrFetchCountries();
        if (!ignore) {
          setCountries(options);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setCountriesError(
            err instanceof Error ? err.message : "Failed to load countries"
          );
        }
      } finally {
        if (!ignore) {
          setCountriesLoading(false);
        }
      }
    }

    fetchCountries();

    return () => {
      ignore = true;
    };
  }, []);

  return { countries, countriesLoading, countriesError };
}
