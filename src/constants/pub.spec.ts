import { describe, expect, it } from "vitest";

import { PHONE_REGEX, PUB_REQUIRED_FIELDS, WEEKDAYS } from "./pub";

describe("PUB_REQUIRED_FIELDS", () => {
  it("contains the five required field names in order", () => {
    expect(PUB_REQUIRED_FIELDS).toEqual([
      "name",
      "city",
      "address",
      "postcode",
      "country",
    ]);
  });

  it("has no duplicate entries", () => {
    expect(new Set(PUB_REQUIRED_FIELDS).size).toBe(PUB_REQUIRED_FIELDS.length);
  });
});

describe("WEEKDAYS", () => {
  it("lists all seven days in Monday-first order", () => {
    expect(WEEKDAYS).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
  });

  it("contains exactly seven days", () => {
    expect(WEEKDAYS).toHaveLength(7);
  });

  it("has no duplicate entries", () => {
    expect(new Set(WEEKDAYS).size).toBe(WEEKDAYS.length);
  });
});

describe("PHONE_REGEX", () => {
  it.each([
    "+44 20 7946 0958",
    "+1-800-555-0199",
    "07700 900000",
    "01234567890",
    "+44",
    "123",
    "",
  ])("accepts valid phone input: %s", (phone) => {
    expect(PHONE_REGEX.test(phone)).toBe(true);
  });

  it.each([
    "not-a-phone",
    "call me",
    "(020) 1234-5678",
    "abc",
    "555.1234",
  ])("rejects invalid phone input: %s", (phone) => {
    expect(PHONE_REGEX.test(phone)).toBe(false);
  });
});
