import { PUB_AMENITY_FIELDS, type PubAmenityKey } from "@/constants/pubFormFields";
import type { PubType } from "@/types/pub";

export type SavedSearchParams = {
  search?: string;
  city?: string;
  name?: string;
  operator?: string;
  borough?: string;
  postcode?: string;
  area?: string;
  country?: string;
  type?: PubType;
  amenities?: Partial<Record<PubAmenityKey, boolean>>;
  lat?: number;
  lng?: number;
  radius?: number;
};

export type SavedSearch = {
  id: string;
  name: string;
  params: SavedSearchParams;
  createdAt: string;
  updatedAt: string;
};

const MAX_FILTER_TEXT_LENGTH = 100;

const AMENITY_KEYS = new Set<string>(PUB_AMENITY_FIELDS.map(({ key }) => key));

/**
 * Builds the API's saved-search params from the pubs page filters, or null
 * when no filter is set (the API rejects an empty search). Only keys the API
 * allows are included — page, limit, sort and editedByMe are not saved.
 */
export function buildSavedSearchParams(filters: {
  search: string;
  amenities: Iterable<PubAmenityKey>;
  type: PubType | "";
  coords: { lat: number; lng: number } | null;
}): SavedSearchParams | null {
  const params: SavedSearchParams = {};
  const search = filters.search.trim().slice(0, MAX_FILTER_TEXT_LENGTH);
  if (search) params.search = search;
  if (filters.type) params.type = filters.type;
  const amenities = Array.from(filters.amenities);
  if (amenities.length > 0) {
    params.amenities = Object.fromEntries(amenities.map((key) => [key, true]));
  }
  if (filters.coords) {
    params.lat = filters.coords.lat;
    params.lng = filters.coords.lng;
  }
  return Object.keys(params).length > 0 ? params : null;
}

/**
 * Turns saved params back into a /pubs page URL so the search can be re-run
 * and shared. Uses the page's own URL format (q, comma-separated amenities)
 * rather than the API's, since that is what the page reads on load.
 */
export function savedSearchToPubsUrl(params: SavedSearchParams): string {
  const qs = new URLSearchParams();
  if (params.search) qs.set("q", params.search);
  const amenities = enabledAmenities(params);
  if (amenities.length > 0) qs.set("amenities", amenities.join(","));
  if (params.type) qs.set("type", params.type);
  if (params.lat !== undefined && params.lng !== undefined) {
    qs.set("lat", String(params.lat));
    qs.set("lng", String(params.lng));
  }
  const query = qs.toString();
  return query ? `/pubs?${query}` : "/pubs";
}

export function enabledAmenities(params: SavedSearchParams): PubAmenityKey[] {
  return Object.entries(params.amenities ?? {})
    .filter(([key, on]) => on && AMENITY_KEYS.has(key))
    .map(([key]) => key as PubAmenityKey);
}

/** Suggested name for a new saved search: the search text, else a summary. */
export function defaultSavedSearchName(params: SavedSearchParams): string {
  const text = params.search ?? params.postcode ?? params.city;
  if (text) return text;
  const labels = enabledAmenities(params).map(
    (key) => PUB_AMENITY_FIELDS.find((field) => field.key === key)?.label ?? key
  );
  if (labels.length > 0) return labels.join(", ").slice(0, MAX_FILTER_TEXT_LENGTH);
  if (params.lat !== undefined) return "Near me";
  return "My search";
}

/** Pulls a readable message out of the API's error shapes. */
export function savedSearchErrorMessage(data: unknown, fallback: string): string {
  if (typeof data !== "object" || data === null) return fallback;
  const obj = data as Record<string, unknown>;
  if (typeof obj.error === "string") return obj.error;
  // 400s use Zod's flatten() shape: { errors: { formErrors, fieldErrors } }.
  const errors = obj.errors as
    | { formErrors?: unknown; fieldErrors?: Record<string, unknown> }
    | undefined;
  if (errors && typeof errors === "object") {
    const messages = [
      ...(Array.isArray(errors.formErrors) ? errors.formErrors : []),
      ...Object.values(errors.fieldErrors ?? {}).flatMap((v) =>
        Array.isArray(v) ? v : []
      ),
    ].filter((m): m is string => typeof m === "string");
    if (messages.length > 0) return messages.join(". ");
  }
  return fallback;
}
