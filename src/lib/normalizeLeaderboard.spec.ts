import { describe, expect, it } from "vitest";
import { normalizeLeaderboard } from "./normalizeLeaderboard";

const VALID_ENTRY = {
  rank: 1,
  userId: "u1",
  displayName: "Alice",
  username: "alice",
  totalAdded: 5,
  totalEdits: 2,
  totalContributions: 7,
};

const EMPTY_PERIODS = {
  "7d": { since: null, leaderboard: [] },
  "30d": { since: null, leaderboard: [] },
  "90d": { since: null, leaderboard: [] },
  all: { since: null, leaderboard: [] },
};

describe("normalizeLeaderboard", () => {
  it("returns fallback for null, primitives, and missing data property", () => {
    const fallback = { periods: EMPTY_PERIODS, generatedAt: "" };
    expect(normalizeLeaderboard(null)).toEqual(fallback);
    expect(normalizeLeaderboard("string")).toEqual(fallback);
    expect(normalizeLeaderboard({})).toEqual(fallback);
    expect(normalizeLeaderboard({ data: null })).toEqual(fallback);
  });

  it("parses a fully valid payload", () => {
    const payload = {
      data: {
        periods: {
          "7d": { since: "2026-07-20T18:05:00.000Z", leaderboard: [VALID_ENTRY] },
          "30d": { since: "2026-06-27T18:05:00.000Z", leaderboard: [VALID_ENTRY] },
          "90d": { since: "2026-04-28T18:05:00.000Z", leaderboard: [VALID_ENTRY] },
          all: { since: null, leaderboard: [VALID_ENTRY] },
        },
        generatedAt: "2026-06-23T00:00:00Z",
      },
    };
    const result = normalizeLeaderboard(payload);
    expect(result.periods["7d"].leaderboard).toEqual([VALID_ENTRY]);
    expect(result.periods["7d"].since).toBe("2026-07-20T18:05:00.000Z");
    expect(result.periods.all.since).toBeNull();
    expect(result.generatedAt).toBe("2026-06-23T00:00:00Z");
  });

  it("filters out entries that are missing required fields", () => {
    const payload = {
      data: {
        periods: {
          all: {
            since: null,
            leaderboard: [VALID_ENTRY, { rank: 2, userId: "u2", displayName: "Bob" }],
          },
        },
        generatedAt: "",
      },
    };
    const result = normalizeLeaderboard(payload);
    expect(result.periods.all.leaderboard).toHaveLength(1);
    expect(result.periods.all.leaderboard[0].userId).toBe("u1");
  });

  it("defaults missing or malformed periods to empty", () => {
    const payload = {
      data: {
        periods: { "7d": { since: 42, leaderboard: "not-an-array" } },
        generatedAt: "2026-01-01",
      },
    };
    const result = normalizeLeaderboard(payload);
    expect(result.periods["7d"]).toEqual({ since: null, leaderboard: [] });
    expect(result.periods["30d"]).toEqual({ since: null, leaderboard: [] });
    expect(result.generatedAt).toBe("2026-01-01");
  });
});
