import type { PubType } from "@/types/pub";

export type PubAmenityKey =
  | "isIndependent"
  | "hasFood"
  | "hasSundayRoast"
  | "hasBeerGarden"
  | "hasCaskAle"
  | "hasCraftBeer"
  | "isCraftBeerPub"
  | "isBeerFocused"
  | "isDogFriendly"
  | "isFamilyFriendly"
  | "hasStepFreeAccess"
  | "hasAccessibleToilet"
  | "hasLiveSport"
  | "hasLiveMusic"
  | "hasPoolTable"
  | "hasDartsBoard"
  | "hasAirConditioning";

export type PubAmenityField = {
  key: PubAmenityKey;
  label: string;
  /** Help text shown to contributors so everyone draws the line in the same place. */
  description?: string;
};

export const PUB_TYPE_OPTIONS: Array<{ value: PubType; label: string }> = [
  { value: "PUB", label: "Pub" },
  { value: "BAR", label: "Bar" },
  { value: "BREWERY", label: "Brewery" },
  { value: "TAPROOM", label: "Taproom" },
  { value: "MICROPUB", label: "Micropub" },
  { value: "SOCIAL_CLUB", label: "Social club" },
  { value: "PRIVATE_MEMBERS_CLUB", label: "Private members' club" },
];

export function getPubTypeLabel(type: PubType | null | undefined): string {
  if (!type) return "Pub";
  return PUB_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? "Pub";
}

export const PUB_AMENITY_FIELDS: PubAmenityField[] = [
  { key: "isIndependent", label: "Independent" },
  { key: "hasFood", label: "Food available" },
  { key: "hasSundayRoast", label: "Sunday roast" },
  { key: "hasBeerGarden", label: "Beer garden" },
  { key: "hasCaskAle", label: "Cask ale" },
  {
    key: "hasCraftBeer",
    label: "Craft beer",
    description:
      "Serves at least one modern craft keg beer from an independent brewery. Macro-owned brands like Camden (e.g. Camden Hells), Beavertown and Goose Island don't count.",
  },
  {
    key: "isCraftBeerPub",
    label: "Craft beer pub",
    description:
      "Craft beer is the main draw, with several rotating independent craft taps. Implies Craft beer.",
  },
  { key: "isBeerFocused", label: "Drinks-led (little or no food)" },
  { key: "isDogFriendly", label: "Dog friendly" },
  { key: "isFamilyFriendly", label: "Family friendly" },
  { key: "hasStepFreeAccess", label: "Step-free access" },
  { key: "hasAccessibleToilet", label: "Accessible toilet" },
  { key: "hasLiveSport", label: "Live sport" },
  { key: "hasLiveMusic", label: "Live music" },
  { key: "hasPoolTable", label: "Pool table" },
  { key: "hasDartsBoard", label: "Darts board" },
  { key: "hasAirConditioning", label: "Air conditioning" },
];

type AmenityValues = Partial<Record<PubAmenityKey, boolean | null | undefined>>;

/**
 * Sets one amenity and keeps dependent amenities consistent: a craft beer pub
 * always has craft beer, so ticking "Craft beer pub" ticks "Craft beer", and
 * unsetting "Craft beer" unsets "Craft beer pub" (the API rejects
 * isCraftBeerPub: true with hasCraftBeer: false).
 */
export function withAmenityValue<T extends AmenityValues>(
  fields: T,
  key: string,
  value: unknown
): T {
  const next: T = { ...fields, [key]: value };
  if (key === "isCraftBeerPub" && value === true) {
    next.hasCraftBeer = true;
  }
  if (key === "hasCraftBeer" && value !== true && next.isCraftBeerPub === true) {
    next.isCraftBeerPub = value === false ? false : null;
  }
  return next;
}
