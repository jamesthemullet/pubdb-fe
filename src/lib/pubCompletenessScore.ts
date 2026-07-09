import { PUB_AMENITY_FIELDS } from "@/constants/pubFormFields";
import type { Pub } from "@/types/pub";

export type CompletenessResult = {
  score: number;
  missing: string[];
};

export function pubCompletenessScore(pub: Pub): CompletenessResult {
  const hasBeerTypes =
    (Array.isArray(pub.beerTypes) && pub.beerTypes.length > 0) ||
    (Array.isArray(pub.beerTypeIds) && pub.beerTypeIds.length > 0) ||
    !!pub.beerType;

  const amenityChecks = PUB_AMENITY_FIELDS.map(({ key, label }) => ({
    label,
    filled: pub[key] === true || pub[key] === false,
  }));

  const checks: Array<{ label: string; filled: boolean }> = [
    { label: "name", filled: !!pub.name?.trim() },
    { label: "address", filled: !!pub.address?.trim() },
    { label: "description", filled: !!pub.description?.trim() },
    { label: "image", filled: !!pub.imageUrl?.trim() },
    { label: "opening hours", filled: !!pub.openingHours && typeof pub.openingHours === "object" && Object.keys(pub.openingHours).length > 0 },
    { label: "beer types", filled: hasBeerTypes },
    { label: "website", filled: !!pub.website?.trim() },
    { label: "phone", filled: !!pub.phone?.trim() },
    { label: "beer garden", filled: !!pub.beerGardens?.length },
    ...amenityChecks,
  ];

  const filledCount = checks.filter((c) => c.filled).length;
  const score = Math.round((filledCount / checks.length) * 100);
  const missing = checks.filter((c) => !c.filled).map((c) => c.label);

  return { score, missing };
}
