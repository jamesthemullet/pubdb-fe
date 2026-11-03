import { PUB_AMENITY_FIELDS, type PubAmenityKey } from "@/constants/pubFormFields";

/** `"Newcastle upon Tyne"` -> `"newcastle-upon-tyne"`. */
export function citySlug(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

/** Finds the city (in its original casing) whose slug matches, or null if none do. */
export function findCityBySlug(cities: string[], slug: string): string | null {
  return cities.find((city) => citySlug(city) === slug) ?? null;
}

/** `"isDogFriendly"` -> `"dog-friendly"`. */
export function amenitySlug(key: PubAmenityKey): string {
  return key
    .replace(/^(is|has)/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

const AMENITY_KEY_BY_SLUG: Record<string, PubAmenityKey> = Object.fromEntries(
  PUB_AMENITY_FIELDS.map(({ key }) => [amenitySlug(key), key])
);

/** `"dog-friendly"` -> `"isDogFriendly"`, or null if no amenity has that slug. */
export function amenityKeyFromSlug(slug: string): PubAmenityKey | null {
  return AMENITY_KEY_BY_SLUG[slug] ?? null;
}
