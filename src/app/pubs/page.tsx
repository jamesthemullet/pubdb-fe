import { Suspense } from "react";
import Typography from "@/app/components/typography/typography";
import { getServerApiUrl } from "@/lib/serverApiUrl";
import type { Pub } from "@/types/pub";
import PubListClient from "./PubListClient";

const PAGE_SIZE = 50;

async function fetchInitialPubs(): Promise<Pub[]> {
  const apiUrl = getServerApiUrl();
  const apiKey = process.env.TESTING_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(`${apiUrl}/api/v1/pubs?limit=${PAGE_SIZE}`, {
      headers: { "X-API-Key": apiKey },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

export default async function PubsPage() {
  const initialPubs = await fetchInitialPubs();

  return (
    <>
      <Typography variant="headingMedium">Pub DB</Typography>
      <Suspense fallback={<Typography>Loading pubs…</Typography>}>
        <PubListClient initialPubs={initialPubs} />
      </Suspense>
    </>
  );
}
