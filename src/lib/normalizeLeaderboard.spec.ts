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

describe("normalizeLeaderboard", () => {
  it("returns fallback for null, primitives, and missing data property", () => {
    const fallback = { leaderboard: [], since: null, generatedAt: "" };
    expect(normalizeLeaderboard(null)).toEqual(fallback);
    expect(normalizeLeaderboard("string")).toEqual(fallback);
    expect(normalizeLeaderboard({})).toEqual(fallback);
    expect(normalizeLeaderboard({ data: null })).toEqual(fallback);
  });

  it("parses a fully valid payload", () => {
    const payload = {
      data: {
        leaderboard: [VALID_ENTRY],
        since: "2026-01-01",
        generatedAt: "2026-06-23T00:00:00Z",
      },
    };
    const result = normalizeLeaderboard(payload);
    expect(result.leaderboard).toHaveLength(1);
    expect(result.leaderboard[0]).toEqual(VALID_ENTRY);
    expect(result.since).toBe("2026-01-01");
    expect(result.generatedAt).toBe("2026-06-23T00:00:00Z");
  });

  it("filters out entries that are missing required fields", () => {
    const payload = {
      data: {
        leaderboard: [
          VALID_ENTRY,
          { rank: 2, userId: "u2", displayName: "Bob" },
        ],
        since: null,
        generatedAt: "",
      },
    };
    const result = normalizeLeaderboard(payload);
    expect(result.leaderboard).toHaveLength(1);
    expect(result.leaderboard[0].userId).toBe("u1");
  });

  it("sets since to null and leaderboard to [] when fields have wrong types", () => {
    const payload = {
      data: { leaderboard: "not-an-array", since: 42, generatedAt: "2026-01-01" },
    };
    const result = normalizeLeaderboard(payload);
    expect(result.leaderboard).toEqual([]);
    expect(result.since).toBeNull();
    expect(result.generatedAt).toBe("2026-01-01");
  });
});
