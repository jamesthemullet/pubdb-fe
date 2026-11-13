import type { Pub } from "@/types/pub";

// Keyed by the full query string sent to /api/pubs. Lets a back-navigation to
// the /pubs list reuse the results it already fetched instead of calling the
// API again for filters/page the user just saw.
type CachedPubsResponse = { data: Pub[]; responseMs: number };

const PUBS_RESPONSE_CACHE = new Map<string, CachedPubsResponse>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const pubsCacheTimestamps = new Map<string, number>();

export function getCachedPubsResponse(
  key: string
): CachedPubsResponse | undefined {
  const timestamp = pubsCacheTimestamps.get(key);
  if (timestamp === undefined || Date.now() - timestamp > CACHE_TTL_MS) {
    return undefined;
  }
  return PUBS_RESPONSE_CACHE.get(key);
}

export function setCachedPubsResponse(
  key: string,
  value: CachedPubsResponse
): void {
  PUBS_RESPONSE_CACHE.set(key, value);
  pubsCacheTimestamps.set(key, Date.now());
}

/**
 * Drops every cached list response. Call after a pub is changed so the list
 * doesn't keep showing stale data on the next visit.
 */
export function clearPubsResponseCache(): void {
  PUBS_RESPONSE_CACHE.clear();
  pubsCacheTimestamps.clear();
}
