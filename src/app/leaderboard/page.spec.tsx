import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({ user: null, isApproved: false, isAdmin: false })),
}));

vi.mock("@/lib/serverApiUrl", () => ({
  getServerApiUrl: () => "http://test-api",
  getTestingApiKeyHeader: () => ({}),
}));

import LeaderboardPage from "./page";

function mockFetch(response: { ok: boolean; json?: () => Promise<unknown> } | null) {
  global.fetch = vi.fn(async () => {
    if (response === null) throw new Error("network error");
    return response as unknown as Response;
  }) as unknown as typeof fetch;
}

describe("LeaderboardPage", () => {
  it("renders the leaderboard for a successful fetch", async () => {
    const period = {
      since: null,
      leaderboard: [
        {
          rank: 1,
          userId: "u1",
          displayName: "Alice Smith",
          username: "alice",
          totalAdded: 10,
          totalEdits: 5,
          totalContributions: 15,
        },
      ],
    };
    mockFetch({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            generatedAt: "2026-06-01T12:30:00Z",
            periods: { "7d": period, "30d": period, "90d": period, all: period },
          },
        }),
    });

    render(await LeaderboardPage());

    expect(screen.getAllByText("Alice Smith").length).toBeGreaterThan(0);
  });

  it("falls back to the empty state when the fetch response is not ok", async () => {
    mockFetch({ ok: false });

    render(await LeaderboardPage());

    expect(screen.getByText("No contributions recorded yet.")).toBeInTheDocument();
  });

  it("falls back to the empty state when the fetch throws", async () => {
    mockFetch(null);

    render(await LeaderboardPage());

    expect(screen.getByText("No contributions recorded yet.")).toBeInTheDocument();
  });
});
