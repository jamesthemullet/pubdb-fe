export type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string;
  username: string;
  totalAdded: number;
  totalEdits: number;
  totalContributions: number;
};

export type LeaderboardData = {
  leaderboard: LeaderboardEntry[];
  since: string | null;
  generatedAt: string;
};

function isLeaderboardEntry(item: unknown): item is LeaderboardEntry {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.rank === "number" &&
    typeof obj.userId === "string" &&
    typeof obj.displayName === "string" &&
    typeof obj.username === "string" &&
    typeof obj.totalAdded === "number" &&
    typeof obj.totalEdits === "number" &&
    typeof obj.totalContributions === "number"
  );
}

export function normalizeLeaderboard(payload: unknown): LeaderboardData {
  const fallback: LeaderboardData = { leaderboard: [], since: null, generatedAt: "" };
  if (typeof payload !== "object" || payload === null) return fallback;
  const root = payload as Record<string, unknown>;
  const data = root.data as Record<string, unknown> | undefined;
  if (typeof data !== "object" || data === null) return fallback;
  return {
    leaderboard: Array.isArray(data.leaderboard)
      ? data.leaderboard.filter(isLeaderboardEntry)
      : [],
    since: typeof data.since === "string" ? data.since : null,
    generatedAt: typeof data.generatedAt === "string" ? data.generatedAt : "",
  };
}
