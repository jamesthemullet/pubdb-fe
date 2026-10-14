import { describe, expect, it } from "vitest";
import { parsePastedAddress } from "./parsePastedAddress";

describe("parsePastedAddress", () => {
  it("splits a comma-separated address into street, city and postcode", () => {
    expect(parsePastedAddress("123 high street, london, nw1 1fr")).toEqual({
      address: "123 high street",
      city: "london",
      postcode: "NW1 1FR",
    });
  });

  it("handles the postcode sharing a segment with the city", () => {
    expect(parsePastedAddress("47 Chandos Place, London WC2N 4HS")).toEqual({
      address: "47 Chandos Place",
      city: "London",
      postcode: "WC2N 4HS",
    });
  });

  it("keeps multi-part street addresses together", () => {
    expect(
      parsePastedAddress("The Old Mill, 5 River Lane, Bath, BA1 1AA")
    ).toEqual({
      address: "The Old Mill, 5 River Lane",
      city: "Bath",
      postcode: "BA1 1AA",
    });
  });

  it("normalises an unspaced postcode", () => {
    expect(parsePastedAddress("1 Main St, Leeds, ls11ab")?.postcode).toBe(
      "LS1 1AB"
    );
  });

  it("ignores a trailing country and handles newlines", () => {
    expect(
      parsePastedAddress("10 Park Road\nManchester\nM1 2AB\nUnited Kingdom")
    ).toEqual({
      address: "10 Park Road",
      city: "Manchester",
      postcode: "M1 2AB",
    });
  });

  it("returns null for text that isn't a full address", () => {
    expect(parsePastedAddress("123 High Street")).toBeNull();
    expect(parsePastedAddress("123 High Street, London")).toBeNull();
    expect(parsePastedAddress("London, NW1 1FR")).toBeNull();
    expect(parsePastedAddress("")).toBeNull();
  });
});
