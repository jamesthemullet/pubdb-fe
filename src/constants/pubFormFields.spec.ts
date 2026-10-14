import { describe, expect, it } from "vitest";

import { PUB_AMENITY_FIELDS, withAmenityValue } from "./pubFormFields";

describe("PUB_AMENITY_FIELDS", () => {
  it("exports all amenity keys with user-facing labels", () => {
    expect(PUB_AMENITY_FIELDS).toEqual([
      { key: "isIndependent", label: "Independent" },
      { key: "hasFood", label: "Food available" },
      { key: "hasSundayRoast", label: "Sunday roast" },
      { key: "hasBeerGarden", label: "Beer garden" },
      { key: "hasCaskAle", label: "Cask ale" },
      { key: "hasCraftBeer", label: "Craft beer", description: expect.stringContaining("Camden") },
      { key: "isCraftBeerPub", label: "Craft beer pub", description: expect.any(String) },
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
    ]);
  });

  it("contains unique amenity keys", () => {
    const keys = PUB_AMENITY_FIELDS.map((field) => field.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("withAmenityValue", () => {
  it("sets the given amenity without touching others", () => {
    expect(withAmenityValue({ hasFood: true }, "hasCaskAle", false)).toEqual({
      hasFood: true,
      hasCaskAle: false,
    });
  });

  it("ticks Craft beer when Craft beer pub is ticked", () => {
    expect(withAmenityValue({ hasCraftBeer: false }, "isCraftBeerPub", true)).toEqual({
      hasCraftBeer: true,
      isCraftBeerPub: true,
    });
  });

  it("unticks Craft beer pub when Craft beer is set to No", () => {
    expect(
      withAmenityValue({ hasCraftBeer: true, isCraftBeerPub: true }, "hasCraftBeer", false)
    ).toEqual({ hasCraftBeer: false, isCraftBeerPub: false });
  });

  it("clears Craft beer pub when Craft beer is cleared", () => {
    expect(
      withAmenityValue({ hasCraftBeer: true, isCraftBeerPub: true }, "hasCraftBeer", null)
    ).toEqual({ hasCraftBeer: null, isCraftBeerPub: null });
  });

  it("leaves Craft beer pub alone when it was not ticked", () => {
    expect(
      withAmenityValue({ hasCraftBeer: true, isCraftBeerPub: false }, "hasCraftBeer", null)
    ).toEqual({ hasCraftBeer: null, isCraftBeerPub: false });
  });
});
