import { describe, expect, it } from "vitest";

import {
  buildSavedSearchParams,
  defaultSavedSearchName,
  savedSearchErrorMessage,
  savedSearchToPubsUrl,
} from "./savedSearches";

const NO_FILTERS = { search: "", amenities: [], type: "", coords: null } as const;

describe("buildSavedSearchParams", () => {
  it("returns null when no filters are set", () => {
    expect(buildSavedSearchParams(NO_FILTERS)).toBeNull();
    expect(buildSavedSearchParams({ ...NO_FILTERS, search: "   " })).toBeNull();
  });

  it("includes only the filters that are set", () => {
    expect(buildSavedSearchParams({ ...NO_FILTERS, search: " Kensington " })).toEqual({
      search: "Kensington",
    });
  });

  it("converts amenities to booleans and coords to numeric lat/lng", () => {
    expect(
      buildSavedSearchParams({
        search: "CR0",
        amenities: ["hasBeerGarden", "isDogFriendly"],
        type: "MICROPUB",
        coords: { lat: 51.37, lng: -0.1 },
      })
    ).toEqual({
      search: "CR0",
      type: "MICROPUB",
      amenities: { hasBeerGarden: true, isDogFriendly: true },
      lat: 51.37,
      lng: -0.1,
    });
  });

  it("truncates search text to the API's 100 character limit", () => {
    const params = buildSavedSearchParams({ ...NO_FILTERS, search: "x".repeat(150) });
    expect(params?.search).toHaveLength(100);
  });
});

describe("savedSearchToPubsUrl", () => {
  it("builds a /pubs URL in the page's own query format", () => {
    const url = savedSearchToPubsUrl({
      search: "CR0",
      type: "PUB",
      amenities: { hasBeerGarden: true, hasFood: false, isDogFriendly: true },
      lat: 51.5,
      lng: -0.12,
    });
    const qs = new URLSearchParams(url.split("?")[1]);
    expect(url.startsWith("/pubs?")).toBe(true);
    expect(qs.get("q")).toBe("CR0");
    expect(qs.get("type")).toBe("PUB");
    expect(qs.get("amenities")).toBe("hasBeerGarden,isDogFriendly");
    expect(qs.get("lat")).toBe("51.5");
    expect(qs.get("lng")).toBe("-0.12");
  });

  it("ignores unknown amenity keys", () => {
    expect(
      savedSearchToPubsUrl({ amenities: { notAThing: true } as never })
    ).toBe("/pubs");
  });
});

describe("defaultSavedSearchName", () => {
  it("prefers the search text, then postcode, then city", () => {
    expect(defaultSavedSearchName({ search: "Kensington", postcode: "CR0" })).toBe(
      "Kensington"
    );
    expect(defaultSavedSearchName({ postcode: "CR0", city: "Croydon" })).toBe("CR0");
    expect(defaultSavedSearchName({ city: "Croydon" })).toBe("Croydon");
  });

  it("falls back to amenity labels, location, or a generic name", () => {
    expect(defaultSavedSearchName({ amenities: { hasBeerGarden: true } })).toBe(
      "Beer garden"
    );
    expect(defaultSavedSearchName({ lat: 1, lng: 2 })).toBe("Near me");
    expect(defaultSavedSearchName({ type: "PUB" })).toBe("My search");
  });
});

describe("savedSearchErrorMessage", () => {
  it("returns the API's error string", () => {
    expect(
      savedSearchErrorMessage({ error: "You can save up to 25 searches" }, "fallback")
    ).toBe("You can save up to 25 searches");
  });

  it("flattens Zod validation errors", () => {
    expect(
      savedSearchErrorMessage(
        {
          errors: {
            formErrors: ["At least one search filter is required"],
            fieldErrors: { name: ["Too long"] },
          },
        },
        "fallback"
      )
    ).toBe("At least one search filter is required. Too long");
  });

  it("uses the fallback for unrecognised shapes", () => {
    expect(savedSearchErrorMessage(null, "fallback")).toBe("fallback");
    expect(savedSearchErrorMessage({ errors: {} }, "fallback")).toBe("fallback");
  });
});
