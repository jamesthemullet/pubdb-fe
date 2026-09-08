import { describe, expect, it } from "vitest";
import type { Pub } from "@/types/pub";
import { getNearbyPubs } from "./nearbyPubs";

function makePub(overrides: Partial<Pub> & { id: string }): Pub {
  return {
    name: "Test Pub",
    city: "London",
    address: "1 Test St",
    postcode: "E1 1AA",
    country: "GB",
    createdAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

const currentPub = makePub({
  id: "current",
  lat: 51.5074,
  lng: -0.1278,
});

describe("getNearbyPubs", () => {
  it("returns an empty array when the current pub has no coordinates", () => {
    const pub = makePub({ id: "no-coords" });
    const others = [makePub({ id: "other", lat: 51.51, lng: -0.13 })];
    expect(getNearbyPubs(pub, others)).toEqual([]);
  });

  it("excludes pubs without lat/lng", () => {
    const noCoords = makePub({ id: "no-coords" });
    const result = getNearbyPubs(currentPub, [noCoords]);
    expect(result).toEqual([]);
  });

  it("excludes the current pub itself even if it appears in the list", () => {
    const result = getNearbyPubs(currentPub, [currentPub]);
    expect(result).toEqual([]);
  });

  it("sorts results by ascending distance and attaches a distance in km", () => {
    const near = makePub({ id: "near", lat: 51.508, lng: -0.128 });
    const far = makePub({ id: "far", lat: 51.6, lng: -0.2 });

    const result = getNearbyPubs(currentPub, [far, near]);

    expect(result.map((pub) => pub.id)).toEqual(["near", "far"]);
    expect(result[0].distance).toBeLessThan(result[1].distance);
    expect(result[0].distance).toBeGreaterThan(0);
  });

  it("limits the number of results returned", () => {
    const others = Array.from({ length: 10 }, (_, i) =>
      makePub({ id: `pub-${i}`, lat: 51.5074 + i * 0.001, lng: -0.1278 })
    );

    const result = getNearbyPubs(currentPub, others, 3);

    expect(result).toHaveLength(3);
  });

  it("defaults to a limit of 5 results", () => {
    const others = Array.from({ length: 10 }, (_, i) =>
      makePub({ id: `pub-${i}`, lat: 51.5074 + i * 0.001, lng: -0.1278 })
    );

    const result = getNearbyPubs(currentPub, others);

    expect(result).toHaveLength(5);
  });
});
