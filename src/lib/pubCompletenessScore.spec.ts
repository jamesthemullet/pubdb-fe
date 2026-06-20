import { describe, expect, it } from "vitest";
import { PUB_AMENITY_FIELDS } from "@/constants/pubFormFields";
import type { Pub } from "@/types/pub";
import { pubCompletenessScore } from "./pubCompletenessScore";

const basePub: Pub = {
  id: "1",
  name: "The Test Pub",
  city: "London",
  address: "1 Test St",
  postcode: "E1 1AA",
  country: "GB",
  createdAt: "2024-01-01T00:00:00Z",
};

// 9 non-amenity fields + 14 amenity fields = 23 total
const TOTAL_CHECKS = 9 + PUB_AMENITY_FIELDS.length;

describe("pubCompletenessScore", () => {
  it("scores correctly for a minimal pub with only name and address", () => {
    const { score, missing } = pubCompletenessScore(basePub);
    expect(score).toBe(Math.round((2 / TOTAL_CHECKS) * 100));
    expect(missing).toContain("description");
    expect(missing).toContain("image");
    expect(missing).toContain("opening hours");
    expect(missing).toContain("beer types");
    expect(missing).toContain("website");
    expect(missing).toContain("phone");
    expect(missing).toContain("beer garden");
    expect(missing).toContain("Pool table");
    expect(missing).toContain("Darts board");
  });

  it("scores 100% for a fully filled pub with all amenities set", () => {
    const allAmenities = Object.fromEntries(
      PUB_AMENITY_FIELDS.map(({ key }) => [key, true])
    ) as Partial<Pub>;
    const pub: Pub = {
      ...basePub,
      ...allAmenities,
      description: "A great pub",
      imageUrl: "https://example.com/img.jpg",
      openingHours: { monday: { open: "12:00", close: "23:00" } },
      beerTypes: [{ id: "1", name: "IPA" }],
      website: "https://testpub.com",
      phone: "01234 567890",
      beerGardens: [{ name: "Main garden" }],
    };
    const { score, missing } = pubCompletenessScore(pub);
    expect(score).toBe(100);
    expect(missing).toHaveLength(0);
  });

  it("counts an amenity set to false as filled (explicitly answered)", () => {
    const pub: Pub = { ...basePub, hasPoolTable: false };
    const { missing } = pubCompletenessScore(pub);
    expect(missing).not.toContain("Pool table");
  });

  it("lists amenity as missing when undefined", () => {
    const { missing } = pubCompletenessScore(basePub);
    expect(missing).toContain("Darts board");
  });

  it("returns missing fields not yet filled", () => {
    const pub: Pub = { ...basePub, description: "Nice pub" };
    const { missing } = pubCompletenessScore(pub);
    expect(missing).not.toContain("description");
    expect(missing).toContain("image");
  });

  it("counts beerTypeIds as satisfying beer types", () => {
    const pub: Pub = { ...basePub, beerTypeIds: ["abc"] };
    const { missing } = pubCompletenessScore(pub);
    expect(missing).not.toContain("beer types");
  });
});
