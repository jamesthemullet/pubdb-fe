"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type {
  Badge,
  LeaderboardData,
  LeaderboardEntry,
  LeaderboardPeriodKey,
  NextBadge,
} from "@/lib/normalizeLeaderboard";
import styles from "./page.module.css";

const PERIOD_TABS: { key: LeaderboardPeriodKey; label: string }[] = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "all", label: "All-time" },
];

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

const BADGE_VARIANTS = ["green", "amber", "orange", "purple", "blue"] as const;

function badgeVariant(index: number): (typeof BADGE_VARIANTS)[number] {
  return BADGE_VARIANTS[index % BADGE_VARIANTS.length];
}

function BadgeList({
  badges,
  className,
}: {
  badges: Badge[];
  className: string;
}) {
  if (badges.length === 0) return null;
  return (
    <div className={className}>
      {badges.map((badge, index) => (
        <span
          key={badge.key}
          className={styles.badge}
          data-variant={badgeVariant(index)}
          role="img"
          aria-label={`${badge.name}: ${badge.description}`}
        >
          {badge.name}
        </span>
      ))}
    </div>
  );
}

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
        {entry.streak > 0 && (
          <span className={styles.podiumStreak}>🔥 {entry.streak}</span>
        )}
      </div>
      <p className={styles.podiumName}>
        {isYou
          ? `You (${entry.displayName || entry.username})`
          : entry.displayName || entry.username}
      </p>
      <BadgeList badges={entry.badges} className={styles.podiumBadges} />
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
  avatarUrl,
  onViewProfile,
}: {
  entry: LeaderboardEntry;
  avatarUrl?: string;
  onViewProfile: () => void;
}) {
  return (
    <div className={styles.yourRankBanner}>
      <span className={styles.yourRankLabel}>YOUR RANK</span>
      {avatarUrl ? (
        // biome-ignore lint/performance/noImgElement: user-supplied external avatar URL, not an optimizable local asset
        <img
          src={avatarUrl}
          alt=""
          width={36}
          height={36}
          className={styles.yourRankAvatar}
        />
      ) : (
        <span className={styles.yourRankAvatar}>{getInitials(entry)}</span>
      )}
      <div className={styles.yourRankInfo}>
        <span className={styles.yourRankName}>
          You ({entry.displayName || entry.username})
        </span>
        <BadgeList badges={entry.badges} className={styles.badgeRow} />
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
        <div className={styles.yourRankStat}>
          <span className={styles.yourRankStatNum}>
            {entry.streak > 0 ? `🔥 ${entry.streak}` : entry.streak}
          </span>
          <span className={styles.yourRankStatLabel}>STREAK</span>
        </div>
      </div>
      <button
        type="button"
        className={styles.viewProfileBtn}
        onClick={onViewProfile}
      >
        View profile <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

const WEEK_METRICS: { key: "totalAdded" | "totalEdits"; label: string }[] = [
  { key: "totalAdded", label: "by new pubs" },
  { key: "totalEdits", label: "by edits" },
];

function TopThisWeekPanel({ entries }: { entries: LeaderboardEntry[] }) {
  const [metric, setMetric] = useState<"totalAdded" | "totalEdits">(
    "totalAdded"
  );

  const top5 = useMemo(
    () => [...entries].sort((a, b) => b[metric] - a[metric]).slice(0, 5),
    [entries, metric]
  );

  if (top5.length === 0) return null;

  const maxValue = top5[0][metric] || 1;

  return (
    <div className={styles.sidebarPanel}>
      <div className={styles.sidebarPanelHeader}>
        <span className={styles.sidebarPanelTitle}>Top this week</span>
        <fieldset className={styles.sidebarPanelToggle} aria-label="Rank top this week by">
          {WEEK_METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`${styles.sidebarPanelSub} ${
                metric === m.key ? styles.sidebarPanelSubActive : ""
              }`}
              aria-pressed={metric === m.key}
              onClick={() => setMetric(m.key)}
            >
              {m.label}
            </button>
          ))}
        </fieldset>
      </div>
      {top5.map((entry, index) => (
        <div key={entry.userId} className={styles.weekRow}>
          <span className={styles.weekRank}>{index + 1}</span>
          <span className={styles.weekName}>
            {entry.displayName || entry.username}
          </span>
          <div className={styles.weekBarWrap}>
            <div
              className={styles.weekBar}
              style={{ width: `${(entry[metric] / maxValue) * 100}%` }}
            />
          </div>
          <span className={styles.weekValue}>{entry[metric]}</span>
        </div>
      ))}
    </div>
  );
}

function ClimbingFastestPanel({ entries }: { entries: LeaderboardEntry[] }) {
  const climbers = useMemo(
    () =>
      entries
        .filter(
          (e): e is LeaderboardEntry & { rankChange: number } =>
            e.rankChange !== null && e.rankChange > 0
        )
        .sort((a, b) => b.rankChange - a.rankChange)
        .slice(0, 3),
    [entries]
  );

  if (climbers.length === 0) return null;

  return (
    <div className={styles.sidebarPanel}>
      <div className={styles.sidebarPanelHeader}>
        <span className={styles.sidebarPanelTitle}>Climbing fastest</span>
        <span className={styles.sidebarPanelSub}>vs previous period</span>
      </div>
      {climbers.map((entry, index) => (
        <div key={entry.userId} className={styles.climbRow}>
          <span
            className={styles.climbAvatar}
            data-variant={badgeVariant(index)}
          >
            {getInitials(entry)}
          </span>
          <div className={styles.climbInfo}>
            <span className={styles.climbName}>
              {entry.displayName || entry.username}
            </span>
            <span className={styles.climbRank}>
              #{entry.previousRank ?? "–"} → #{entry.rank}
            </span>
          </div>
          <span className={styles.climbGain}>+{entry.rankChange}</span>
        </div>
      ))}
    </div>
  );
}

function EarnBadgesPanel({ nextBadges }: { nextBadges: NextBadge[] }) {
  if (nextBadges.length === 0) return null;
  return (
    <div className={styles.sidebarPanel}>
      <div className={styles.sidebarPanelHeader}>
        <span className={styles.sidebarPanelTitle}>Earn badges</span>
      </div>
      {nextBadges.map((badge) => (
        <div key={badge.key} className={styles.earnRow}>
          <span className={styles.earnEmoji} aria-hidden="true">
            🎯
          </span>
          <div className={styles.earnInfo}>
            <div className={styles.earnNameRow}>
              <span className={styles.earnName}>{badge.name}</span>
              <span className={styles.earnProgress}>
                {badge.remaining} to go
              </span>
            </div>
            <span className={styles.earnDesc}>{badge.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Client component ──────────────────────────────────────────────────────────

export default function LeaderboardClient({ data }: { data: LeaderboardData }){
  const { user } = useAuth();
  const router = useRouter();
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriodKey>("30d");

  const period = data.periods[activePeriod];
  const entries = period.leaderboard;

  const username = user?.username?.toLowerCase() ?? "";
  const emailPrefix = user?.email?.split("@")[0]?.toLowerCase() ?? "";
  const yourEntry = useMemo(
    () =>
      entries.find(
        (e) =>
          (username && e.username.toLowerCase() === username) ||
          e.username.toLowerCase() === emailPrefix ||
          nameInitials(e.displayName ?? "").toLowerCase() === emailPrefix
      ),
    [entries, username, emailPrefix]
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

      {/* Promo banner */}
      <div className={styles.promoBanner}>
        🎉 100+ contributions this month unlocks free Developer tier API
        access. Developer only · 2026 introductory offer.
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterLeft}>
          <div className={styles.timePills}>
            {PERIOD_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`${styles.timePill} ${
                  activePeriod === tab.key ? styles.timePillActive : ""
                }`}
                aria-pressed={activePeriod === tab.key}
                onClick={() => setActivePeriod(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
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
          {period.since && (
            <>
              <span className={styles.metaDivider}>·</span>
              <span>
                since{" "}
                {new Date(period.since).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </>
          )}
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
              avatarUrl={user?.image}
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
                  aria-label={`Sort by total contributions, currently ${sortDir === "desc" ? "descending" : "ascending"}`}
                >
                  Total contributions <span aria-hidden="true">{sortDir === "desc" ? "↓" : "↑"}</span>
                </button>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.colRank} scope="col">#</th>
                    <th className={styles.colContributor} scope="col">CONTRIBUTOR</th>
                    <th className={styles.colNum} scope="col">ADDED</th>
                    <th className={styles.colNum} scope="col">EDITS</th>
                    <th className={styles.colNum} scope="col">TOTAL</th>
                    <th className={styles.colNum} scope="col">STREAK</th>
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
                              <BadgeList
                                badges={entry.badges}
                                className={styles.badgeRow}
                              />
                            </div>
                          </div>
                        </td>
                        <td className={styles.colNum}>{entry.totalAdded}</td>
                        <td className={styles.colNum}>{entry.totalEdits}</td>
                        <td className={`${styles.colNum} ${styles.totalCell}`}>
                          {entry.totalContributions.toLocaleString()}
                        </td>
                        <td className={styles.colNum}>
                          {entry.streak > 0 ? `🔥 ${entry.streak}` : entry.streak}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.sidebar}>
              <TopThisWeekPanel entries={data.periods["7d"].leaderboard} />
              <ClimbingFastestPanel entries={entries} />
              {yourEntry && (
                <EarnBadgesPanel nextBadges={yourEntry.nextBadges} />
              )}
            </div>
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
