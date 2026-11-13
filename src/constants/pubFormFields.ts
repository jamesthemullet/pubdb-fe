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
  | "hasDj"
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
  { key: "hasDj", label: "DJs" },
  { key: "hasPoolTable", label: "Pool table" },
  { key: "hasDartsBoard", label: "Darts board" },
  { key: "hasAirConditioning", label: "Air conditioning" },
];

type AmenityValues = Partial<Record<PubAmenityKey, boolean | null | undefined>>;

/**
 * Remembers what "Craft beer" was before ticking "Craft beer pub" switched it
 * on, so it can be put back if "Craft beer pub" is later moved off "yes".
 * Symbol keys survive object spread (so other form setters keep it) but are
 * skipped by Object.entries and JSON.stringify, so it never reaches the API.
 */
const IMPLIED_CRAFT_BEER_PREVIOUS = Symbol("impliedCraftBeerPrevious");

type WithImpliedMemory = { [IMPLIED_CRAFT_BEER_PREVIOUS]?: boolean | null };

/**
 * Sets one amenity and keeps dependent amenities consistent: a craft beer pub
 * always has craft beer, so ticking "Craft beer pub" ticks "Craft beer", and
 * unsetting "Craft beer" unsets "Craft beer pub" (the API rejects
 * isCraftBeerPub: true with hasCraftBeer: false). If "Craft beer pub" is then
 * moved off "yes", "Craft beer" goes back to what it was before it was ticked
 * automatically.
 */
export function withAmenityValue<T extends AmenityValues>(
  fields: T,
  key: string,
  value: unknown
): T {
  const next = { ...fields, [key]: value } as T & WithImpliedMemory;

  if (key === "isCraftBeerPub") {
    if (value === true) {
      if (next.hasCraftBeer !== true) {
        next[IMPLIED_CRAFT_BEER_PREVIOUS] = next.hasCraftBeer ?? null;
        (next as AmenityValues).hasCraftBeer = true;
      }
    } else if (IMPLIED_CRAFT_BEER_PREVIOUS in next) {
      (next as AmenityValues).hasCraftBeer = next[IMPLIED_CRAFT_BEER_PREVIOUS] ?? null;
      delete next[IMPLIED_CRAFT_BEER_PREVIOUS];
    }
  }

  if (key === "hasCraftBeer") {
    // An explicit choice for "Craft beer" replaces the remembered value.
    delete next[IMPLIED_CRAFT_BEER_PREVIOUS];
    if (value !== true && next.isCraftBeerPub === true) {
      (next as AmenityValues).isCraftBeerPub = value === false ? false : null;
    }
  }

  return next;
}
