import { describe, expect, it } from "vitest";
import { normalizeLeaderboard } from "./normalizeLeaderboard";

const VALID_ENTRY = {
  rank: 1,
  userId: "user-1",
  displayName: "Alice",
  username: "alice",
  totalAdded: 10,
  totalEdits: 5,
  totalContributions: 15,
};

describe("normalizeLeaderboard", () => {
  it("returns the fallback when given null, a non-object, or a payload with no data key", () => {
    const fallback = { leaderboard: [], since: null, generatedAt: "" };
    expect(normalizeLeaderboard(null)).toEqual(fallback);
    expect(normalizeLeaderboard("not-an-object")).toEqual(fallback);
    expect(normalizeLeaderboard({ other: "key" })).toEqual(fallback);
  });

  it("normalises a valid payload, resolves optional fields, and filters invalid entries", () => {
    const payload = {
      data: {
        leaderboard: [
          VALID_ENTRY,
          // missing username — should be filtered out
          { rank: 2, userId: "u2", displayName: "Bob", totalAdded: 1, totalEdits: 0, totalContributions: 1 },
        ],
        since: "2026-01-01",
        generatedAt: "2026-06-01T12:00:00Z",
      },
    };
    expect(normalizeLeaderboard(payload)).toEqual({
      leaderboard: [VALID_ENTRY],
      since: "2026-01-01",
      generatedAt: "2026-06-01T12:00:00Z",
    });
  });
});
