import { normalizeLeaderboard } from "@/lib/normalizeLeaderboard";
import { getServerApiUrl, getTestingApiKeyHeader } from "@/lib/serverApiUrl";
import LeaderboardClient from "./LeaderboardClient";

export default async function LeaderboardPage(){
  const apiUrl = getServerApiUrl();
  const headers = getTestingApiKeyHeader();

  let payload: unknown = null;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/contributors/leaderboard`,
      { next: { revalidate: 300 }, headers }
    );
    if (res.ok) {
      payload = await res.json();
    } else {
      // biome-ignore lint/suspicious/noConsole: server-side error logging for a silent fallback
      console.error(`Failed to fetch leaderboard: ${res.status}`);
    }
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: server-side error logging for a silent fallback
    console.error("Failed to fetch leaderboard:", error);
  }
  const data = normalizeLeaderboard(payload);
  return <LeaderboardClient data={data} />;
}
