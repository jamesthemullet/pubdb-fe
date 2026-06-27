"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { LeaderboardData, LeaderboardEntry } from "@/lib/normalizeLeaderboard";
import styles from "./page.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

function nameInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getInitials(entry: LeaderboardEntry): string {
  return entry.displayName
    ? nameInitials(entry.displayName)
    : entry.username.slice(0, 2).toUpperCase();
}

// ── Sub-components ────────────────────────────────────────────────────────────

const MEDAL: Record<1 | 2 | 3, { bg: string; text: string }> = {
  1: { bg: "#fbbf24", text: "#78350f" },
  2: { bg: "#9ca3af", text: "#1f2937" },
  3: { bg: "#b45309", text: "#fef3c7" },
};

function PodiumCard({
  entry,
  position,
  elevated,
  isYou,
}: {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
  elevated?: boolean;
  isYou?: boolean;
}) {
  const medal = MEDAL[position];
  return (
    <div
      className={`${styles.podiumCard} ${
        elevated ? styles.podiumCardElevated : ""
      }`}
    >
      <div
        className={styles.podiumMedal}
        style={{ background: medal.bg, color: medal.text }}
      >
        {position}
      </div>
      <div className={styles.podiumAvatarWrap}>
        <span className={styles.podiumAvatar}>{getInitials(entry)}</span>
      </div>
      <p className={styles.podiumName}>
        {isYou
          ? `You (${entry.displayName || entry.username})`
          : entry.displayName || entry.username}
      </p>
      <div className={styles.podiumStats}>
        <div className={styles.podiumStat}>
          <span className={styles.podiumStatNum}>{entry.totalAdded}</span>
          <span className={styles.podiumStatLabel}>ADDED</span>
        </div>
        <div className={styles.podiumStat}>
          <span className={styles.podiumStatNum}>
            {entry.totalEdits.toLocaleString()}
          </span>
          <span className={styles.podiumStatLabel}>EDITS</span>
        </div>
        <div className={styles.podiumStat}>
          <span className={`${styles.podiumStatNum} ${styles.podiumStatTotal}`}>
            {entry.totalContributions.toLocaleString()}
          </span>
          <span className={styles.podiumStatLabel}>TOTAL</span>
        </div>
      </div>
    </div>
  );
}

function YourRankBanner({
  entry,
  onViewProfile,
}: {
  entry: LeaderboardEntry;
  onViewProfile: () => void;
}) {
  return (
    <div className={styles.yourRankBanner}>
      <span className={styles.yourRankLabel}>YOUR RANK</span>
      <span className={styles.yourRankAvatar}>{getInitials(entry)}</span>
      <div className={styles.yourRankInfo}>
        <span className={styles.yourRankName}>
          You ({entry.displayName || entry.username})
        </span>
      </div>
      <div className={styles.yourRankStats}>
        <div className={styles.yourRankStat}>
          <span className={styles.yourRankStatNum}>{entry.totalAdded}</span>
          <span className={styles.yourRankStatLabel}>ADDED</span>
        </div>
        <div className={styles.yourRankStat}>
          <span className={styles.yourRankStatNum}>{entry.totalEdits}</span>
          <span className={styles.yourRankStatLabel}>EDITS</span>
        </div>
        <div className={styles.yourRankStat}>
          <span className={styles.yourRankStatNum}>
            {entry.totalContributions}
          </span>
          <span className={styles.yourRankStatLabel}>TOTAL</span>
        </div>
      </div>
      <button
        type="button"
        className={styles.viewProfileBtn}
        onClick={onViewProfile}
      >
        View profile →
      </button>
    </div>
  );
}

// ── Client component ──────────────────────────────────────────────────────────

export default function LeaderboardClient({ data }: { data: LeaderboardData }) {
  const { user } = useAuth();
  const router = useRouter();
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const entries = data.leaderboard;

  const emailPrefix = user?.email?.split("@")[0]?.toLowerCase() ?? "";
  const yourEntry = useMemo(
    () =>
      entries.find(
        (e) =>
          e.username.toLowerCase() === emailPrefix ||
          nameInitials(e.displayName ?? "").toLowerCase() === emailPrefix
      ),
    [entries, emailPrefix]
  );

  const hasPodium = entries.length >= 3;
  const top3 = hasPodium
    ? (entries.slice(0, 3) as [LeaderboardEntry, LeaderboardEntry, LeaderboardEntry])
    : null;

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) =>
        sortDir === "desc"
          ? b.totalContributions - a.totalContributions
          : a.totalContributions - b.totalContributions
      ),
    [entries, sortDir]
  );

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "Contributor leaderboard – Pub DB", url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Contributor leaderboard</h1>
            <span className={styles.endpointBadge}>GET /v1/leaderboard</span>
          </div>
          <p className={styles.description}>
            The people keeping the dataset alive. Ranked by total contributions
            — new pubs added carry more weight than edits.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleShare}
          >
            <ShareIcon /> Share
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterLeft} />
        <div className={styles.filterMeta}>
          <span className={styles.snapshotDot} />
          <span>
            {data.generatedAt
              ? `Snapshot ${new Date(data.generatedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Snapshot …"}
          </span>
          <span className={styles.metaDivider}>·</span>
          <span>
            {entries.length > 0
              ? `${entries.length.toLocaleString()} contributor${
                  entries.length !== 1 ? "s" : ""
                }`
              : "—"}
          </span>
        </div>
      </div>

      {entries.length === 0 && (
        <div className={styles.loading}>No contributions recorded yet.</div>
      )}

      {entries.length > 0 && (
        <>
          {/* Podium */}
          {top3 && (
            <div className={styles.podiumSection}>
              <PodiumCard
                entry={top3[1]}
                position={2}
                isYou={yourEntry?.userId === top3[1].userId}
              />
              <PodiumCard
                entry={top3[0]}
                position={1}
                elevated
                isYou={yourEntry?.userId === top3[0].userId}
              />
              <PodiumCard
                entry={top3[2]}
                position={3}
                isYou={yourEntry?.userId === top3[2].userId}
              />
            </div>
          )}

          {/* Your rank banner */}
          {yourEntry && (
            <YourRankBanner
              entry={yourEntry}
              onViewProfile={() => router.push("/profile")}
            />
          )}

          {/* Full ranking table + sidebar */}
          <div className={styles.mainBody}>
            <div className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <div className={styles.tableHeaderLeft}>
                  <h2 className={styles.tableTitle}>Full ranking</h2>
                </div>
                <button
                  type="button"
                  className={styles.sortBtn}
                  onClick={() =>
                    setSortDir((d) => (d === "desc" ? "asc" : "desc"))
                  }
                >
                  Total contributions {sortDir === "desc" ? "↓" : "↑"}
                </button>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.colRank}>#</th>
                    <th className={styles.colContributor}>CONTRIBUTOR</th>
                    <th className={styles.colNum}>ADDED</th>
                    <th className={styles.colNum}>EDITS</th>
                    <th className={styles.colActivity}>ACTIVITY</th>
                    <th className={styles.colNum}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEntries.map((entry) => {
                    const isYou = yourEntry?.userId === entry.userId;
                    return (
                      <tr
                        key={entry.userId}
                        className={isYou ? styles.yourRow : undefined}
                      >
                        <td className={styles.colRank}>{entry.rank}</td>
                        <td className={styles.colContributor}>
                          <div className={styles.contributorCell}>
                            <span className={styles.rowAvatar}>
                              {getInitials(entry)}
                            </span>
                            <div className={styles.contributorInfo}>
                              <div className={styles.contributorNameRow}>
                                <span className={styles.contributorName}>
                                  {isYou
                                    ? `You (${
                                        entry.displayName || entry.username
                                      })`
                                    : entry.displayName || entry.username}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={styles.colNum}>{entry.totalAdded}</td>
                        <td className={styles.colNum}>{entry.totalEdits}</td>
                        <td className={`${styles.colNum} ${styles.totalCell}`}>
                          {entry.totalContributions.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.sidebar} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ShareIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9.5 1L13 4.5M13 4.5L9.5 8M13 4.5H5a3 3 0 000 6h1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
