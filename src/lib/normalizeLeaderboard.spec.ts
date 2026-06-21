import { describe, expect, it } from "vitest";
import { normalizeLeaderboard } from "./normalizeLeaderboard";

const VALID_ENTRY = {
  rank: 1,
  userId: "u1",
  displayName: "Alice",
  username: "alice",
  totalAdded: 5,
  totalEdits: 3,
  totalContributions: 8,
};

describe("normalizeLeaderboard", () => {
  it("returns the fallback when payload is null", () => {
    expect(normalizeLeaderboard(null)).toEqual({ leaderboard: [], since: null, generatedAt: "" });
  });

  it("returns the fallback when payload has no data property", () => {
    expect(normalizeLeaderboard({ other: 123 })).toEqual({ leaderboard: [], since: null, generatedAt: "" });
  });

  it("normalizes a complete valid payload", () => {
    const payload = {
      data: {
        leaderboard: [VALID_ENTRY],
        since: "2024-01-01",
        generatedAt: "2024-06-01T00:00:00Z",
      },
    };
    const result = normalizeLeaderboard(payload);
    expect(result.leaderboard).toHaveLength(1);
    expect(result.leaderboard[0]).toEqual(VALID_ENTRY);
    expect(result.since).toBe("2024-01-01");
    expect(result.generatedAt).toBe("2024-06-01T00:00:00Z");
  });

  it("filters out entries that fail the type guard", () => {
    const payload = {
      data: {
        leaderboard: [
          VALID_ENTRY,
          { rank: "not-a-number", userId: "u2", displayName: "Bob", username: "bob", totalAdded: 1, totalEdits: 0, totalContributions: 1 },
          null,
        ],
        since: null,
        generatedAt: "2024-06-01T00:00:00Z",
      },
    };
    const result = normalizeLeaderboard(payload);
    expect(result.leaderboard).toHaveLength(1);
    expect(result.leaderboard[0].userId).toBe("u1");
  });

  it("sets since to null when data.since is not a string", () => {
    const payload = { data: { leaderboard: [], since: 0, generatedAt: "now" } };
    expect(normalizeLeaderboard(payload).since).toBeNull();
  });

  it("sets generatedAt to empty string when data.generatedAt is not a string", () => {
    const payload = { data: { leaderboard: [], since: null, generatedAt: null } };
    expect(normalizeLeaderboard(payload).generatedAt).toBe("");
  });
});
