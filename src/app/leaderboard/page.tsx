import { getServerApiUrl } from "@/lib/serverApiUrl";
import { normalizeLeaderboard } from "@/lib/normalizeLeaderboard";
import LeaderboardClient from "./LeaderboardClient";

export default async function LeaderboardPage() {
  const apiUrl = getServerApiUrl();
  let payload: unknown = null;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/contributors/leaderboard`,
      { next: { revalidate: 300 } }
    );
    if (res.ok) payload = await res.json();
  } catch {
    // render with empty data on network failure
  }
  const data = normalizeLeaderboard(payload);
  return <LeaderboardClient data={data} />;
}
