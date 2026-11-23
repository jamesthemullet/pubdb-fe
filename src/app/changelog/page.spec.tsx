import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/serverApiUrl", () => ({
  getServerApiUrl: () => "http://test-api",
  getTestingApiKeyHeader: () => ({}),
}));

import ChangelogPage from "./page";

function mockFetch(response: { ok: boolean; json?: () => Promise<unknown> } | null) {
  global.fetch = vi.fn(async () => {
    if (response === null) throw new Error("network error");
    return response as unknown as Response;
  }) as unknown as typeof fetch;
}

describe("ChangelogPage", () => {
  it("renders version entries for a successful fetch", async () => {
    mockFetch({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            {
              version: "1.2.0",
              date: "2026-06-01",
              items: [{ type: "added", text: "Added the leaderboard" }],
            },
          ],
        }),
    });

    render(await ChangelogPage());

    expect(screen.getByText("v1.2.0")).toBeInTheDocument();
    expect(screen.getByText("Added the leaderboard")).toBeInTheDocument();
  });

  it("falls back to the empty state when the fetch response is not ok", async () => {
    mockFetch({ ok: false });

    render(await ChangelogPage());

    expect(screen.getByText("No changelog entries yet.")).toBeInTheDocument();
  });

  it("falls back to the empty state when the fetch throws", async () => {
    mockFetch(null);

    render(await ChangelogPage());

    expect(screen.getByText("No changelog entries yet.")).toBeInTheDocument();
  });
});
