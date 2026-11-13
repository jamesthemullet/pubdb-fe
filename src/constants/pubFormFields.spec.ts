import { describe, expect, it } from "vitest";

import { PUB_AMENITY_FIELDS, withAmenityValue } from "./pubFormFields";

// Strips the internal symbol-keyed memory so assertions compare only real fields.
const plain = (fields: object) => Object.fromEntries(Object.entries(fields));

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
      { key: "hasDj", label: "DJs" },
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
    expect(plain(withAmenityValue({ hasCraftBeer: false }, "isCraftBeerPub", true))).toEqual({
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

  it("restores Craft beer when Craft beer pub is cycled on to No and then Not set", () => {
    const ticked = withAmenityValue({ hasCraftBeer: null }, "isCraftBeerPub", true);
    expect(plain(ticked)).toEqual({ hasCraftBeer: true, isCraftBeerPub: true });

    const no = withAmenityValue(ticked, "isCraftBeerPub", false);
    expect(no).toEqual({ hasCraftBeer: null, isCraftBeerPub: false });

    const unset = withAmenityValue(no, "isCraftBeerPub", null);
    expect(unset).toEqual({ hasCraftBeer: null, isCraftBeerPub: null });
  });

  it("restores Craft beer to No if it was No before Craft beer pub was ticked", () => {
    const ticked = withAmenityValue({ hasCraftBeer: false }, "isCraftBeerPub", true);
    expect(withAmenityValue(ticked, "isCraftBeerPub", false)).toEqual({
      hasCraftBeer: false,
      isCraftBeerPub: false,
    });
  });

  it("keeps Craft beer as Yes if it was already Yes before Craft beer pub was ticked", () => {
    const ticked = withAmenityValue({ hasCraftBeer: true }, "isCraftBeerPub", true);
    expect(withAmenityValue(ticked, "isCraftBeerPub", false)).toEqual({
      hasCraftBeer: true,
      isCraftBeerPub: false,
    });
  });

  it("remembers the previous Craft beer value across other field changes", () => {
    const ticked = withAmenityValue({ hasCraftBeer: null }, "isCraftBeerPub", true);
    const otherEdit = { ...withAmenityValue(ticked, "hasFood", true), name: "The Harp" };
    expect(withAmenityValue(otherEdit, "isCraftBeerPub", false)).toEqual({
      hasCraftBeer: null,
      isCraftBeerPub: false,
      hasFood: true,
      name: "The Harp",
    });
  });

  it("keeps an explicit Craft beer choice made after Craft beer pub was ticked", () => {
    const ticked = withAmenityValue({ hasCraftBeer: null }, "isCraftBeerPub", true);
    const explicit = withAmenityValue(ticked, "hasCraftBeer", true);
    expect(withAmenityValue(explicit, "isCraftBeerPub", false)).toEqual({
      hasCraftBeer: true,
      isCraftBeerPub: false,
    });
  });

  it("never serialises the remembered value", () => {
    const ticked = withAmenityValue({ hasCraftBeer: null }, "isCraftBeerPub", true);
    expect(JSON.parse(JSON.stringify(ticked))).toEqual({ hasCraftBeer: true, isCraftBeerPub: true });
    expect(Object.keys(ticked)).toEqual(["hasCraftBeer", "isCraftBeerPub"]);
  });
});
