import { describe, expect, it } from "vitest";

import { PUB_AMENITY_FIELDS } from "./pubFormFields";

describe("PUB_AMENITY_FIELDS", () => {
  it("exports all amenity keys with user-facing labels", () => {
    expect(PUB_AMENITY_FIELDS).toEqual([
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
    ]);
  });

  it("contains unique amenity keys", () => {
    const keys = PUB_AMENITY_FIELDS.map((field) => field.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
