import { describe, expect, it } from "vitest";
import { normalizeChangelog } from "./normalizeChangelog";

const VALID_VERSION = {
  version: "1.0.0",
  date: "2026-07-18",
  items: [
    { type: "added", text: "Public launch of the REST API." },
    { type: "fixed", text: "Fixed pagination edge case." },
  ],
};

describe("normalizeChangelog", () => {
  it("returns [] for null, primitives, and missing data property", () => {
    expect(normalizeChangelog(null)).toEqual([]);
    expect(normalizeChangelog("string")).toEqual([]);
    expect(normalizeChangelog({})).toEqual([]);
    expect(normalizeChangelog({ data: null })).toEqual([]);
  });

  it("parses a fully valid payload", () => {
    const result = normalizeChangelog({ data: [VALID_VERSION] });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(VALID_VERSION);
  });

  it("filters out versions with invalid items", () => {
    const result = normalizeChangelog({
      data: [
        VALID_VERSION,
        { version: "0.9.0", date: "2026-01-01", items: [{ type: "unknown", text: "x" }] },
        { version: "0.8.0", date: "2026-01-01" },
      ],
    });
    expect(result).toHaveLength(1);
    expect(result[0].version).toBe("1.0.0");
  });

  it("returns [] when data is not an array", () => {
    expect(normalizeChangelog({ data: "not-an-array" })).toEqual([]);
  });
});
