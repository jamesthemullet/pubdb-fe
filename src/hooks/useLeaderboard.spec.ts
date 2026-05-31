import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useLeaderboard } from "./useLeaderboard";

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json" },
	});
}

const SAMPLE_PAYLOAD = {
	data: {
		leaderboard: [
			{
				rank: 1,
				userId: "u1",
				displayName: "Alice",
				username: "alice",
				totalAdded: 10,
				totalEdits: 5,
				totalContributions: 15,
			},
			{
				rank: 2,
				userId: "u2",
				displayName: "Bob",
				username: "bob",
				totalAdded: 8,
				totalEdits: 2,
				totalContributions: 10,
			},
		],
		since: "2026-01-01",
		generatedAt: "2026-05-31T00:00:00Z",
	},
};

describe("useLeaderboard", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("starts in loading state with no data or error", () => {
		vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));

		const { result } = renderHook(() => useLeaderboard());

		expect(result.current.leaderboardLoading).toBe(true);
		expect(result.current.leaderboard).toBeNull();
		expect(result.current.leaderboardError).toBeNull();
	});

	it("returns normalized leaderboard data after a successful fetch", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(SAMPLE_PAYLOAD));

		const { result } = renderHook(() => useLeaderboard());
		await waitFor(() => expect(result.current.leaderboardLoading).toBe(false));

		expect(result.current.leaderboard).toEqual({
			leaderboard: SAMPLE_PAYLOAD.data.leaderboard,
			since: "2026-01-01",
			generatedAt: "2026-05-31T00:00:00Z",
		});
		expect(result.current.leaderboardError).toBeNull();
	});

	it("sets error and clears loading on non-ok response", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ error: "Unauthorized" }, 401),
		);

		const { result } = renderHook(() => useLeaderboard());
		await waitFor(() => expect(result.current.leaderboardLoading).toBe(false));

		expect(result.current.leaderboardError).toMatch(/Failed to fetch leaderboard: 401/);
		expect(result.current.leaderboard).toBeNull();
	});

	it("sets error and clears loading when fetch throws", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network failure"));

		const { result } = renderHook(() => useLeaderboard());
		await waitFor(() => expect(result.current.leaderboardLoading).toBe(false));

		expect(result.current.leaderboardError).toBe("Network failure");
		expect(result.current.leaderboard).toBeNull();
	});
});
