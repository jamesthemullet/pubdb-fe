import { useEffect, useState } from "react";
import {
  type LeaderboardData,
  normalizeLeaderboard,
} from "@/lib/normalizeLeaderboard";

export type { LeaderboardData };

export function useLeaderboard(): {
  leaderboard: LeaderboardData | null;
  leaderboardLoading: boolean;
  leaderboardError: string | null;
} {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function fetchLeaderboard(): Promise<void> {
      setLeaderboardLoading(true);
      setLeaderboardError(null);
      try {
        const res = await fetch("/api/leaderboard", {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch leaderboard: ${res.status}`);
        }
        const payload: unknown = await res.json();
        if (!ignore) {
          setLeaderboard(normalizeLeaderboard(payload));
        }
      } catch (err) {
        if (!ignore) {
          setLeaderboardError(
            err instanceof Error ? err.message : "Unable to load leaderboard."
          );
        }
      } finally {
        if (!ignore) {
          setLeaderboardLoading(false);
        }
      }
    }

    fetchLeaderboard();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  return { leaderboard, leaderboardLoading, leaderboardError };
}
