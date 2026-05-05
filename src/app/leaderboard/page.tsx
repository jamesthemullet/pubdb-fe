"use client";

import Typography from "@/app/components/typography/typography";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import styles from "./page.module.css";

export default function Leaderboard() {
  const { leaderboard, leaderboardLoading, leaderboardError } = useLeaderboard();

  return (
    <>
      <Typography variant="headingMedium">Contributor Leaderboard</Typography>

      {leaderboardLoading ? (
        <Typography role="status" aria-live="polite">Loading leaderboard…</Typography>
      ) : leaderboardError ? (
        <Typography role="alert" className={styles.errorText}>
          Error loading leaderboard: {leaderboardError}
        </Typography>
      ) : !leaderboard || leaderboard.leaderboard.length === 0 ? (
        <Typography>No contributions recorded yet.</Typography>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.rank}>#</th>
                <th>Contributor</th>
                <th>Pubs added</th>
                <th>Edits</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.leaderboard.map((entry) => (
                <tr key={entry.userId}>
                  <td className={styles.rank}>{entry.rank}</td>
                  <td>{entry.displayName || entry.username}</td>
                  <td>{entry.totalAdded}</td>
                  <td>{entry.totalEdits}</td>
                  <td>{entry.totalContributions}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {leaderboard.generatedAt && (
            <p className={styles.meta}>
              Last updated: {new Date(leaderboard.generatedAt).toLocaleString()}
            </p>
          )}
        </>
      )}
    </>
  );
}
