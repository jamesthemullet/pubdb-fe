import { describe, expect, it } from "vitest";
import { PUB_AMENITY_FIELDS } from "@/constants/pubFormFields";
import {
  amenityKeyFromSlug,
  amenitySlug,
  citySlug,
  findCityBySlug,
} from "./citySlug";

describe("citySlug", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(citySlug("Newcastle upon Tyne")).toBe("newcastle-upon-tyne");
  });

  it("trims surrounding whitespace", () => {
    expect(citySlug("  Leeds  ")).toBe("leeds");
  });

  it("leaves an already-hyphenated city name as-is other than casing", () => {
    expect(citySlug("Stoke-on-Trent")).toBe("stoke-on-trent");
    expect(citySlug("Stoke-On-Trent")).toBe("stoke-on-trent");
  });

  it("strips characters that aren't letters, numbers, spaces or hyphens", () => {
    expect(citySlug("St. Albans!")).toBe("st-albans");
  });

  it("collapses repeated whitespace into a single hyphen", () => {
    expect(citySlug("New  York")).toBe("new-york");
  });
});

describe("findCityBySlug", () => {
  const cities = ["Leeds", "Newcastle upon Tyne", "Stoke-on-Trent"];

  it("returns the original-cased city matching the slug", () => {
    expect(findCityBySlug(cities, "newcastle-upon-tyne")).toBe(
      "Newcastle upon Tyne"
    );
  });

  it("returns null when no city matches", () => {
    expect(findCityBySlug(cities, "manchester")).toBeNull();
  });

  it("matches the first city when slugs collide", () => {
    expect(
      findCityBySlug(["Stoke-On-Trent", "Stoke-on-Trent"], "stoke-on-trent")
    ).toBe("Stoke-On-Trent");
  });
});

describe("amenitySlug", () => {
  it("converts an isX amenity key into a hyphenated slug", () => {
    expect(amenitySlug("isDogFriendly")).toBe("dog-friendly");
  });

  it("converts a hasX amenity key into a hyphenated slug", () => {
    expect(amenitySlug("hasBeerGarden")).toBe("beer-garden");
  });

  it("lowercases a single-word amenity key", () => {
    expect(amenitySlug("isIndependent")).toBe("independent");
  });

  it("produces a distinct slug for every amenity field, invertible via amenityKeyFromSlug", () => {
    const slugs = new Set<string>();
    for (const { key } of PUB_AMENITY_FIELDS) {
      const slug = amenitySlug(key);
      expect(slugs.has(slug)).toBe(false);
      slugs.add(slug);
      expect(amenityKeyFromSlug(slug)).toBe(key);
    }
  });
});

describe("amenityKeyFromSlug", () => {
  it("returns the amenity key for a known slug", () => {
    expect(amenityKeyFromSlug("dog-friendly")).toBe("isDogFriendly");
  });

  it("returns null for an unknown slug", () => {
    expect(amenityKeyFromSlug("not-a-real-amenity")).toBeNull();
  });
});
