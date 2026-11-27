import { describe, expect, it } from "vitest";
import type { Pub } from "@/types/pub";
import { buildPubsApiSample, buildPubsRequestLine } from "./pubsApiRequest";

const PUB: Pub = {
  id: "pub_1",
  name: "The Crown & Anchor",
  city: "Leeds",
  area: "City Centre",
  address: "1 Test St",
  postcode: "LS1 1AA",
  country: "GB",
  hasCaskAle: true,
  hasSundayRoast: false,
  createdAt: "2024-01-01T00:00:00Z",
};

describe("buildPubsRequestLine", () => {
  it("builds a request line for a city", () => {
    expect(buildPubsRequestLine({ city: "Leeds" })).toBe("GET /pubs?city=Leeds");
  });

  it("encodes a multi-word city", () => {
    expect(buildPubsRequestLine({ city: "Newcastle upon Tyne" })).toBe(
      "GET /pubs?city=Newcastle+upon+Tyne"
    );
  });

  it("includes the amenity filter when given", () => {
    expect(
      buildPubsRequestLine({ city: "Leeds", amenity: "isDogFriendly" })
    ).toBe("GET /pubs?city=Leeds&amenities%5BisDogFriendly%5D=true");
  });
});

describe("buildPubsApiSample", () => {
  it("trims a pub down to the sample fields", () => {
    const sample = buildPubsApiSample([PUB], 1, 50);

    expect(sample.data).toEqual([
      {
        id: "pub_1",
        name: "The Crown & Anchor",
        city: "Leeds",
        area: "City Centre",
        postcode: "LS1 1AA",
        country: "GB",
        hasCaskAle: true,
        hasSundayRoast: false,
      },
    ]);
  });

  it("omits fields the pub doesn't have", () => {
    const minimal: Pub = {
      id: "pub_2",
      name: "The Bare Arms",
      city: "Leeds",
      address: "2 Test St",
      postcode: "LS1 1AB",
      country: "GB",
      createdAt: "2024-01-01T00:00:00Z",
    };

    const sample = buildPubsApiSample([minimal], 1, 50);

    expect(sample.data[0]).toEqual({
      id: "pub_2",
      name: "The Bare Arms",
      city: "Leeds",
      postcode: "LS1 1AB",
      country: "GB",
    });
  });

  it("caps the sample to sampleSize pubs", () => {
    const sample = buildPubsApiSample([PUB, PUB, PUB], 3, 50, 2);
    expect(sample.data).toHaveLength(2);
  });

  it("builds pagination from the given total and page size", () => {
    const sample = buildPubsApiSample([PUB], 120, 50);

    expect(sample.pagination).toEqual({
      page: 1,
      limit: 50,
      total: 120,
      pages: 3,
      hasNext: true,
      hasPrev: false,
    });
  });

  it("reports no next page when everything fits on one page", () => {
    const sample = buildPubsApiSample([PUB], 5, 50);
    expect(sample.pagination.hasNext).toBe(false);
    expect(sample.pagination.pages).toBe(1);
  });
});
