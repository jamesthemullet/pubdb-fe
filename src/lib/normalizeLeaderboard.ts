export type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string;
  username: string;
  totalAdded: number;
  totalEdits: number;
  totalContributions: number;
};

export type LeaderboardPeriodKey = "7d" | "30d" | "90d" | "all";

export type LeaderboardPeriod = {
  since: string | null;
  leaderboard: LeaderboardEntry[];
};

export type LeaderboardData = {
  periods: Record<LeaderboardPeriodKey, LeaderboardPeriod>;
  generatedAt: string;
};

const PERIOD_KEYS: LeaderboardPeriodKey[] = ["7d", "30d", "90d", "all"];

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

function normalizePeriod(value: unknown): LeaderboardPeriod {
  if (typeof value !== "object" || value === null) {
    return { since: null, leaderboard: [] };
  }
  const obj = value as Record<string, unknown>;
  return {
    since: typeof obj.since === "string" ? obj.since : null,
    leaderboard: Array.isArray(obj.leaderboard)
      ? obj.leaderboard.filter(isLeaderboardEntry)
      : [],
  };
}

function emptyPeriods(): Record<LeaderboardPeriodKey, LeaderboardPeriod> {
  return {
    "7d": { since: null, leaderboard: [] },
    "30d": { since: null, leaderboard: [] },
    "90d": { since: null, leaderboard: [] },
    all: { since: null, leaderboard: [] },
  };
}

export function normalizeLeaderboard(payload: unknown): LeaderboardData {
  const fallback: LeaderboardData = { periods: emptyPeriods(), generatedAt: "" };

  if (typeof payload !== "object" || payload === null) return fallback;
  const root = payload as Record<string, unknown>;
  const data = root.data as Record<string, unknown> | undefined;
  if (typeof data !== "object" || data === null) return fallback;

  const rawPeriods = data.periods as Record<string, unknown> | undefined;
  const periods = emptyPeriods();
  for (const key of PERIOD_KEYS) {
    periods[key] = normalizePeriod(
      typeof rawPeriods === "object" && rawPeriods !== null ? rawPeriods[key] : undefined
    );
  }

  return {
    periods,
    generatedAt: typeof data.generatedAt === "string" ? data.generatedAt : "",
  };
}
