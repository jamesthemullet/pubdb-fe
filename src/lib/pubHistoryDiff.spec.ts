import { describe, expect, it } from "vitest";
import type { PubHistoryChange } from "@/types/pub";
import {
  deepEqual,
  describeFieldChange,
  formatScalarValue,
  humanizeFieldName,
  listChangedFields,
} from "./pubHistoryDiff";

describe("humanizeFieldName", () => {
  it("inserts a space before an inner capital and capitalizes the first letter", () => {
    expect(humanizeFieldName("chainName")).toBe("Chain Name");
  });

  it("capitalizes a single-word field", () => {
    expect(humanizeFieldName("area")).toBe("Area");
  });
});

describe("deepEqual", () => {
  it("is true for primitives that are ===", () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual("a", "a")).toBe(true);
  });

  it("is false when one side is null and the other is an object", () => {
    expect(deepEqual(null, {})).toBe(false);
  });

  it("is false when one is an array and the other is a plain object", () => {
    expect(deepEqual([], {})).toBe(false);
  });

  it("is false when objects have a different number of keys", () => {
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("is true for deeply equal nested objects", () => {
    expect(deepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 2] } })).toBe(true);
  });

  it("is false for nested objects that differ", () => {
    expect(deepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 3] } })).toBe(false);
  });
});

describe("formatScalarValue", () => {
  it("renders an em dash for null, undefined, empty string and empty arrays", () => {
    expect(formatScalarValue(null)).toBe("—");
    expect(formatScalarValue(undefined)).toBe("—");
    expect(formatScalarValue("")).toBe("—");
    expect(formatScalarValue([])).toBe("—");
  });

  it("formats an ISO date string down to its date part", () => {
    expect(formatScalarValue("2024-03-05T12:30:00.000Z")).toBe("2024-03-05");
  });

  it("stringifies a non-date scalar", () => {
    expect(formatScalarValue(42)).toBe("42");
    expect(formatScalarValue("The Red Lion")).toBe("The Red Lion");
  });
});

describe("describeFieldChange", () => {
  const change = (from: unknown, to: unknown): PubHistoryChange => ({ from, to });

  it("returns null when from and to are deeply equal", () => {
    expect(describeFieldChange("name", change("The Red Lion", "The Red Lion"))).toBeNull();
  });

  it("formats a boolean amenity field as Yes/No", () => {
    expect(describeFieldChange("hasPoolTable", change(false, true))).toBe("Pool table No → Yes");
  });

  it("formats closedDown as a boolean field even though it isn't an amenity", () => {
    expect(describeFieldChange("closedDown", change(false, true))).toBe("Closed down No → Yes");
  });

  it("formats a non-boolean value on a boolean field as an em dash", () => {
    expect(describeFieldChange("hasPoolTable", change(null, true))).toBe("Pool table — → Yes");
  });

  it("reports 'added' for a summary-only field going from empty to non-empty", () => {
    expect(describeFieldChange("openingHours", change(null, { monday: {} }))).toBe(
      "Opening hours added"
    );
  });

  it("reports 'removed' for a summary-only field going from non-empty to empty", () => {
    expect(describeFieldChange("beerGardens", change([{ name: "Garden" }], []))).toBe(
      "Beer gardens removed"
    );
  });

  it("reports 'updated' for a summary-only field changing between two non-empty values", () => {
    expect(
      describeFieldChange("beerTypes", change([{ id: "1" }], [{ id: "1" }, { id: "2" }]))
    ).toBe("Beer types updated");
  });

  it("reports 'updated' for any array field even if not in the summary-only set", () => {
    expect(describeFieldChange("amenities", change(["a"], ["b"]))).toBe("Amenities updated");
  });

  it("reports 'updated' for a non-array object field", () => {
    expect(describeFieldChange("location", change({ lat: 1 }, { lat: 2 }))).toBe(
      "Location updated"
    );
  });

  it("uses a known label and falls back to a humanized field name otherwise", () => {
    expect(describeFieldChange("name", change("Old Name", "New Name"))).toBe(
      "Name Old Name → New Name"
    );
    expect(describeFieldChange("chainName", change("Old Co", "New Co"))).toBe(
      "Chain Old Co → New Co"
    );
  });
});

describe("listChangedFields", () => {
  it("returns an empty array when there are no changed fields", () => {
    expect(listChangedFields(undefined)).toEqual([]);
  });

  it("filters out hidden bookkeeping fields and unchanged fields", () => {
    const changes = listChangedFields({
      id: { from: "1", to: "1" },
      createdAt: { from: "a", to: "b" },
      name: { from: "Old Name", to: "Old Name" },
      website: { from: "a.com", to: "b.com" },
    });
    expect(changes).toEqual(["Website a.com → b.com"]);
  });

  it("describes every remaining changed field", () => {
    const changes = listChangedFields({
      name: { from: "Old Name", to: "New Name" },
      closedDown: { from: false, to: true },
    });
    expect(changes).toEqual(["Name Old Name → New Name", "Closed down No → Yes"]);
  });
});
