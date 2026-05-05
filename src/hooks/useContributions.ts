import { useEffect, useState } from "react";
import { buildAuthHeaders } from "@/lib/auth";

export type RecentPub = {
  id: string;
  name: string;
  city: string;
  createdAt: string;
};

export type ContributionsData = {
  totalAdded: number;
  recentPubs: RecentPub[];
};

function isRecentPub(item: unknown): item is RecentPub {
  if (typeof item !== "object" || item === null) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.city === "string" &&
    typeof obj.createdAt === "string"
  );
}

function normalizeContributions(payload: unknown): ContributionsData {
  if (typeof payload !== "object" || payload === null) {
    return { totalAdded: 0, recentPubs: [] };
  }
  const obj = payload as Record<string, unknown>;
  const totalAdded = typeof obj.totalAdded === "number" ? obj.totalAdded : 0;
  const recentPubs = Array.isArray(obj.recentPubs)
    ? obj.recentPubs.filter(isRecentPub)
    : [];
  return { totalAdded, recentPubs };
}

export function useContributions(): {
  contributions: ContributionsData | null;
  contributionsLoading: boolean;
  contributionsError: string | null;
} {
  const [contributions, setContributions] = useState<ContributionsData | null>(null);
  const [contributionsLoading, setContributionsLoading] = useState(true);
  const [contributionsError, setContributionsError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function fetchContributions(): Promise<void> {
      setContributionsLoading(true);
      setContributionsError(null);

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      try {
        const res = await fetch("/api/contributions", {
          headers: buildAuthHeaders(token),
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch contributions: ${res.status}`);
        }
        const payload: unknown = await res.json();
        if (!ignore) {
          setContributions(normalizeContributions(payload));
        }
      } catch (err) {
        if (!ignore) {
          setContributionsError(
            err instanceof Error ? err.message : "Unable to load contributions."
          );
        }
      } finally {
        if (!ignore) {
          setContributionsLoading(false);
        }
      }
    }

    fetchContributions();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  return { contributions, contributionsLoading, contributionsError };
}
