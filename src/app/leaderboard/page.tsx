"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { type LeaderboardEntry, useLeaderboard } from "@/hooks/useLeaderboard";
import styles from "./page.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type TimePeriod = "7d" | "30d" | "90d" | "all";

const TIME_PERIODS: { id: TimePeriod; label: string }[] = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "all", label: "All-time" },
];

type BadgeVariant = "green" | "orange" | "purple" | "amber" | "blue";

interface Badge {
  label: string;
  variant: BadgeVariant;
}

interface MockProfile {
  handle: string;
  location: string;
  joined: string;
  badges: Badge[];
  streak: number;
  avatarColor: string;
  activity: number[];
}

// ── Static decorative data keyed by rank ──────────────────────────────────────

const MOCK_PROFILES: Record<number, MockProfile> = {
  1: {
    handle: "@jamesthemonkeh",
    location: "London",
    joined: "2024-01",
    badges: [{ label: "Founder", variant: "amber" }],
    streak: 14,
    avatarColor: "#2563eb",
    activity: [5, 8, 6, 10, 9, 12, 11],
  },
  2: {
    handle: "@sienna_p",
    location: "Edinburgh",
    joined: "2023-08",
    badges: [
      { label: "Verified", variant: "green" },
      { label: "Garden expert", variant: "green" },
    ],
    streak: 31,
    avatarColor: "#2563eb",
    activity: [18, 24, 20, 30, 28, 35, 32],
  },
  3: {
    handle: "@alex.k",
    location: "Manchester",
    joined: "2023-09",
    badges: [{ label: "Beer nerd", variant: "purple" }],
    streak: 22,
    avatarColor: "#10b981",
    activity: [15, 20, 18, 25, 22, 28, 26],
  },
  4: {
    handle: "@imo",
    location: "Bristol",
    joined: "2024-01",
    badges: [{ label: "Verified", variant: "green" }],
    streak: 18,
    avatarColor: "#6366f1",
    activity: [12, 18, 14, 22, 20, 25, 22],
  },
  5: {
    handle: "@danob",
    location: "Dublin",
    joined: "2024-02",
    badges: [{ label: "Roast rater", variant: "orange" }],
    streak: 12,
    avatarColor: "#f97316",
    activity: [10, 15, 12, 18, 16, 20, 19],
  },
};

const CLIMBING_FASTEST = [
  { initials: "IR", color: "#6366f1", name: "Imogen Reid", from: 22, to: 4, gain: 18 },
  { initials: "TL", color: "#14b8a6", name: "Tomás Linhart", from: 19, to: 8, gain: 11 },
  { initials: "AD", color: "#f97316", name: "Aoife Doyle", from: 18, to: 11, gain: 7 },
];

const TOP_THIS_WEEK = [
  { name: "James Winfield", value: 24 },
  { name: "Sienna Park", value: 19 },
  { name: "Alex Kovač", value: 14 },
  { name: "Daniel Ó Briain", value: 11 },
];

const EARN_BADGES = [
  {
    emoji: "🌿",
    label: "Garden expert",
    description: "Edit 25 beer garden entries",
    progress: 17,
    total: 25,
  },
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

function getMock(rank: number): MockProfile {
  return (
    MOCK_PROFILES[rank] ?? {
      handle: `@user${rank}`,
      location: "UK",
      joined: "2024-06",
      badges: [],
      streak: 0,
      avatarColor: "#64748b",
      activity: [3, 5, 4, 6, 5, 7, 6],
    }
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  const W = 80;
  const H = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
  const mock = getMock(entry.rank);
  const medal = MEDAL[position];
  return (
    <div className={`${styles.podiumCard} ${elevated ? styles.podiumCardElevated : ""}`}>
      <div className={styles.podiumMedal} style={{ background: medal.bg, color: medal.text }}>
        {position}
      </div>
      <div className={styles.podiumAvatarWrap}>
        <span className={styles.podiumAvatar} style={{ background: mock.avatarColor }}>
          {getInitials(entry)}
        </span>
        {mock.streak > 0 && (
          <span className={styles.podiumStreak}>🔥 {mock.streak}</span>
        )}
      </div>
      <p className={styles.podiumName}>
        {isYou ? `You (${entry.displayName || entry.username})` : (entry.displayName || entry.username)}
      </p>
      <p className={styles.podiumMeta}>
        {mock.handle} · {mock.location}
      </p>
      {mock.badges.length > 0 && (
        <div className={styles.podiumBadges}>
          {mock.badges.map((b) => (
            <span key={b.label} className={styles.badge} data-variant={b.variant}>
              {b.label}
            </span>
          ))}
        </div>
      )}
      <div className={styles.podiumStats}>
        <div className={styles.podiumStat}>
          <span className={styles.podiumStatNum}>{entry.totalAdded}</span>
          <span className={styles.podiumStatLabel}>ADDED</span>
        </div>
        <div className={styles.podiumStat}>
          <span className={styles.podiumStatNum}>{entry.totalEdits.toLocaleString()}</span>
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

function YourRankBanner({ entry }: { entry: LeaderboardEntry }) {
  const mock = getMock(entry.rank);
  return (
    <div className={styles.yourRankBanner}>
      <span className={styles.yourRankLabel}>YOUR RANK</span>
      <span className={styles.yourRankAvatar} style={{ background: mock.avatarColor }}>
        {getInitials(entry)}
      </span>
      <div className={styles.yourRankInfo}>
        <span className={styles.yourRankName}>
          You ({entry.displayName || entry.username})
        </span>
        <span className={styles.yourRankMeta}>
          {mock.handle} · {mock.location}
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
          <span className={styles.yourRankStatNum}>🔥 {mock.streak}</span>
          <span className={styles.yourRankStatLabel}>DAY STREAK</span>
        </div>
        <div className={styles.yourRankStat}>
          <span className={styles.yourRankStatNum}>{entry.totalContributions}</span>
          <span className={styles.yourRankStatLabel}>TOTAL</span>
        </div>
      </div>
      <button type="button" className={styles.viewProfileBtn}>
        View profile →
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { leaderboard, leaderboardLoading, leaderboardError } = useLeaderboard();
  const { user } = useAuth();
  const [period, setPeriod] = useState<TimePeriod>("30d");

  const entries = leaderboard?.leaderboard ?? [];

  // Find the current user's entry by matching username to email prefix
  const emailPrefix = user?.email?.split("@")[0]?.toLowerCase() ?? "";
  const yourEntry = entries.find(
    (e) =>
      e.username.toLowerCase() === emailPrefix ||
      nameInitials(e.displayName ?? "").toLowerCase() === emailPrefix,
  );

  // Podium only when 3+ entries exist; arranged as 2nd–1st–3rd
  const hasPodium = entries.length >= 3;
  const top3 = hasPodium
    ? (entries.slice(0, 3) as [LeaderboardEntry, LeaderboardEntry, LeaderboardEntry])
    : null;

  const periodLabel =
    period === "7d" ? "last 7d"
    : period === "30d" ? "last 30d"
    : period === "90d" ? "last 90d"
    : "all time";

  function handleCopyAsCurl() {
    navigator.clipboard.writeText(
      'curl "https://hopeful-playfulness-production.up.railway.app/contributors/leaderboard" \\\n  -H "Authorization: Bearer $PUBDB_KEY"',
    );
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
            The people keeping the dataset alive. Ranked by total contributions — new pubs
            added carry more weight than edits.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.actionBtn} onClick={handleCopyAsCurl}>
            <CopyIcon /> Copy as cURL
          </button>
          <button type="button" className={styles.actionBtn}>
            <ShareIcon /> Share
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.filterLeft}>
          <div className={styles.timePills}>
            {TIME_PERIODS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`${styles.timePill} ${period === id ? styles.timePillActive : ""}`}
                onClick={() => setPeriod(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <select className={styles.regionSelect} aria-label="Filter by region">
            <option>All regions</option>
            <option>UK</option>
            <option>Ireland</option>
            <option>Europe</option>
          </select>
        </div>
        <div className={styles.filterMeta}>
          <span className={styles.snapshotDot} />
          <span>
            {leaderboard?.generatedAt
              ? `Snapshot ${new Date(leaderboard.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Snapshot …"}
          </span>
          <span className={styles.metaDivider}>·</span>
          <span>
            {entries.length > 0 ? `${entries.length.toLocaleString()} contributor${entries.length !== 1 ? "s" : ""}` : "—"}
          </span>
        </div>
      </div>

      {/* Loading / error */}
      {leaderboardLoading && <div className={styles.loading}>Loading leaderboard…</div>}
      {leaderboardError && (
        <div className={styles.errorMsg}>Error loading leaderboard: {leaderboardError}</div>
      )}

      {!leaderboardLoading && !leaderboardError && entries.length === 0 && (
        <div className={styles.loading}>No contributions recorded yet.</div>
      )}

      {!leaderboardLoading && !leaderboardError && entries.length > 0 && (
        <>
          {/* Podium */}
          {top3 && (
            <div className={styles.podiumSection}>
              <PodiumCard entry={top3[1]} position={2} isYou={yourEntry?.userId === top3[1].userId} />
              <PodiumCard entry={top3[0]} position={1} elevated isYou={yourEntry?.userId === top3[0].userId} />
              <PodiumCard entry={top3[2]} position={3} isYou={yourEntry?.userId === top3[2].userId} />
            </div>
          )}

          {/* Your rank banner */}
          {yourEntry && <YourRankBanner entry={yourEntry} />}

          {/* Full ranking table + sidebar */}
          <div className={styles.mainBody}>
            <div className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <div className={styles.tableHeaderLeft}>
                  <span className={styles.tableTitle}>Full ranking</span>
                  <span className={styles.tablePeriodLabel}>{periodLabel}</span>
                </div>
                <button type="button" className={styles.sortBtn}>
                  Total contributions ↓
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
                  {entries.map((entry) => {
                    const mock = getMock(entry.rank);
                    const isYou = yourEntry?.userId === entry.userId;
                    return (
                      <tr key={entry.userId} className={isYou ? styles.yourRow : undefined}>
                        <td className={styles.colRank}>{entry.rank}</td>
                        <td className={styles.colContributor}>
                          <div className={styles.contributorCell}>
                            <span
                              className={styles.rowAvatar}
                              style={{ background: mock.avatarColor }}
                            >
                              {getInitials(entry)}
                            </span>
                            <div className={styles.contributorInfo}>
                              <div className={styles.contributorNameRow}>
                                <span className={styles.contributorName}>
                                  {isYou
                                    ? `You (${entry.displayName || entry.username})`
                                    : (entry.displayName || entry.username)}
                                </span>
                                {mock.streak > 0 && (
                                  <span className={styles.streakInline}>🔥 {mock.streak}</span>
                                )}
                                {mock.badges.map((b) => (
                                  <span
                                    key={b.label}
                                    className={styles.badge}
                                    data-variant={b.variant}
                                  >
                                    {b.label}
                                  </span>
                                ))}
                              </div>
                              <div className={styles.contributorMeta}>
                                {mock.handle} · {mock.location} · joined {mock.joined}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={styles.colNum}>{entry.totalAdded}</td>
                        <td className={styles.colNum}>{entry.totalEdits}</td>
                        <td className={styles.colActivity}>
                          <Sparkline data={mock.activity} />
                        </td>
                        <td className={`${styles.colNum} ${styles.totalCell}`}>
                          {entry.totalContributions.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.sidebar}>
              {/* Climbing fastest */}
              <div className={styles.sidebarPanel}>
                <div className={styles.sidebarPanelHeader}>
                  <span className={styles.sidebarPanelTitle}>Climbing fastest</span>
                  <span className={styles.sidebarPanelSub}>vs prev period</span>
                </div>
                {CLIMBING_FASTEST.map((item) => (
                  <div key={item.name} className={styles.climbRow}>
                    <span className={styles.climbAvatar} style={{ background: item.color }}>
                      {item.initials}
                    </span>
                    <div className={styles.climbInfo}>
                      <span className={styles.climbName}>{item.name}</span>
                      <span className={styles.climbRank}>#{item.from} → #{item.to}</span>
                    </div>
                    <span className={styles.climbGain}>+{item.gain}</span>
                  </div>
                ))}
              </div>

              {/* Top this week */}
              <div className={styles.sidebarPanel}>
                <div className={styles.sidebarPanelHeader}>
                  <span className={styles.sidebarPanelTitle}>Top this week</span>
                  <span className={styles.sidebarPanelSub}>by new pubs</span>
                </div>
                {TOP_THIS_WEEK.map((item, i) => (
                  <div key={item.name} className={styles.weekRow}>
                    <span className={styles.weekRank}>{i + 1}</span>
                    <span className={styles.weekName}>{item.name}</span>
                    <div className={styles.weekBarWrap}>
                      <div
                        className={styles.weekBar}
                        style={{ width: `${(item.value / 24) * 100}%` }}
                      />
                    </div>
                    <span className={styles.weekValue}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Earn badges */}
              <div className={styles.sidebarPanel}>
                <div className={styles.sidebarPanelHeader}>
                  <span className={styles.sidebarPanelTitle}>Earn badges</span>
                  <span className={styles.sidebarPanelSub}>contribute more</span>
                </div>
                {EARN_BADGES.map((b) => (
                  <div key={b.label} className={styles.earnRow}>
                    <span className={styles.earnEmoji}>{b.emoji}</span>
                    <div className={styles.earnInfo}>
                      <div className={styles.earnNameRow}>
                        <span className={styles.earnName}>{b.label}</span>
                        <span className={styles.earnProgress}>{b.progress}/{b.total}</span>
                      </div>
                      <p className={styles.earnDesc}>{b.description}</p>
                      <div className={styles.earnBarWrap}>
                        <div
                          className={styles.earnBar}
                          style={{ width: `${(b.progress / b.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1.5" y="3.5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 2H11a1 1 0 011 1v7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
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
