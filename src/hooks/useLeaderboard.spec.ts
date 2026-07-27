import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLeaderboard } from "./useLeaderboard";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const ALICE_ENTRY = {
  rank: 1,
  userId: "user-1",
  displayName: "Alice",
  username: "alice",
  totalAdded: 10,
  totalEdits: 5,
  totalContributions: 15,
  streak: 4,
  badges: [],
  nextBadges: [],
};

const SAMPLE_PAYLOAD = {
  data: {
    periods: {
      "7d": { since: "2026-05-25", leaderboard: [ALICE_ENTRY] },
      "30d": { since: "2026-05-02", leaderboard: [ALICE_ENTRY] },
      "90d": { since: "2026-03-03", leaderboard: [ALICE_ENTRY] },
      all: { since: null, leaderboard: [ALICE_ENTRY] },
    },
    generatedAt: "2026-06-01T12:00:00Z",
  },
};

describe("useLeaderboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in a loading state with no data or error", () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useLeaderboard());
    expect(result.current.leaderboardLoading).toBe(true);
    expect(result.current.leaderboard).toBeNull();
    expect(result.current.leaderboardError).toBeNull();
  });

  it("returns normalised leaderboard data after a successful fetch", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(SAMPLE_PAYLOAD));
    const { result } = renderHook(() => useLeaderboard());
    await waitFor(() => expect(result.current.leaderboardLoading).toBe(false));
    expect(result.current.leaderboard?.periods["30d"].leaderboard).toEqual([ALICE_ENTRY]);
    expect(result.current.leaderboard?.periods.all.since).toBeNull();
    expect(result.current.leaderboard?.generatedAt).toBe("2026-06-01T12:00:00Z");
    expect(result.current.leaderboardError).toBeNull();
  });

  it("sets an error message when the response status is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 500));
    const { result } = renderHook(() => useLeaderboard());
    await waitFor(() => expect(result.current.leaderboardLoading).toBe(false));
    expect(result.current.leaderboardError).toMatch(/Failed to fetch leaderboard/);
    expect(result.current.leaderboard).toBeNull();
  });

  it("filters out leaderboard entries that are missing required fields", async () => {
    const payload = {
      data: {
        periods: {
          all: {
            since: null,
            leaderboard: [
              // valid entry
              {
                rank: 1,
                userId: "u1",
                displayName: "Bob",
                username: "bob",
                totalAdded: 3,
                totalEdits: 1,
                totalContributions: 4,
              },
              // invalid — missing username
              { rank: 2, userId: "u2", displayName: "Eve", totalAdded: 1, totalEdits: 0, totalContributions: 1 },
            ],
          },
        },
        generatedAt: "2026-06-01T00:00:00Z",
      },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(payload));
    const { result } = renderHook(() => useLeaderboard());
    await waitFor(() => expect(result.current.leaderboardLoading).toBe(false));
    expect(result.current.leaderboard?.periods.all.leaderboard).toHaveLength(1);
    expect(result.current.leaderboard?.periods.all.leaderboard[0].displayName).toBe("Bob");
  });
});
