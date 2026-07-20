import { normalizeLeaderboard } from "@/lib/normalizeLeaderboard";
import { getServerApiUrl } from "@/lib/serverApiUrl";
import LeaderboardClient from "./LeaderboardClient";

export default async function LeaderboardPage(): Promise<React.JSX.Element> {
  const apiUrl = getServerApiUrl();
  const headers: Record<string, string> = {};
  const apiKey = process.env.TESTING_API_KEY;
  if (apiKey) headers["X-API-Key"] = apiKey;

  let payload: unknown = null;
  try {
    const res = await fetch(
      `${apiUrl}/api/v1/contributors/leaderboard`,
      { next: { revalidate: 300 }, headers }
    );
    if (res.ok) payload = await res.json();
  } catch {
    // render with empty data on network failure
  }
  const data = normalizeLeaderboard(payload);
  return <LeaderboardClient data={data} />;
}
