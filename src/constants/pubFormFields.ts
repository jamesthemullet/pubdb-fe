export type PubAmenityKey =
  | "isIndependent"
  | "hasFood"
  | "hasSundayRoast"
  | "hasBeerGarden"
  | "hasCaskAle"
  | "isBeerFocused"
  | "isDogFriendly"
  | "isFamilyFriendly"
  | "hasStepFreeAccess"
  | "hasAccessibleToilet"
  | "hasLiveSport"
  | "hasLiveMusic"
  | "hasPoolTable"
  | "hasDartsBoard";

export type PubAmenityField = {
  key: PubAmenityKey;
  label: string;
};

export const PUB_AMENITY_FIELDS: PubAmenityField[] = [
  { key: "isIndependent", label: "Independent" },
  { key: "hasFood", label: "Food available" },
  { key: "hasSundayRoast", label: "Sunday roast" },
  { key: "hasBeerGarden", label: "Beer garden" },
  { key: "hasCaskAle", label: "Cask ale" },
  { key: "isBeerFocused", label: "Beer-focused" },
  { key: "isDogFriendly", label: "Dog friendly" },
  { key: "isFamilyFriendly", label: "Family friendly" },
  { key: "hasStepFreeAccess", label: "Step-free access" },
  { key: "hasAccessibleToilet", label: "Accessible toilet" },
  { key: "hasLiveSport", label: "Live sport" },
  { key: "hasLiveMusic", label: "Live music" },
  { key: "hasPoolTable", label: "Pool table" },
  { key: "hasDartsBoard", label: "Darts board" },
];
