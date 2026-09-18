import { normalizeChangelog } from "@/lib/normalizeChangelog";
import { getServerApiUrl } from "@/lib/serverApiUrl";
import ChangelogClient from "./ChangelogClient";

export default async function ChangelogPage(){
  const apiUrl = getServerApiUrl();
  const headers: Record<string, string> = {};
  const apiKey = process.env.TESTING_API_KEY;
  if (apiKey) headers["X-API-Key"] = apiKey;

  let payload: unknown = null;
  try {
    const res = await fetch(`${apiUrl}/api/v1/changelog`, {
      next: { revalidate: 300 },
      headers,
    });
    if (res.ok) {
      payload = await res.json();
    } else {
      // biome-ignore lint/suspicious/noConsole: server-side error logging for a silent fallback
      console.error(`Failed to fetch changelog: ${res.status}`);
    }
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: server-side error logging for a silent fallback
    console.error("Failed to fetch changelog:", error);
  }
  const versions = normalizeChangelog(payload);
  return <ChangelogClient versions={versions} />;
}
