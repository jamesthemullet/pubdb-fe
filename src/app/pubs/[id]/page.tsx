import { getServerApiUrl } from "@/lib/serverApiUrl";
import type { Pub } from "@/types/pub";
import PubPageClient from "./PubPageClient";

export default async function PubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apiUrl = getServerApiUrl();
  let pub: Pub | null = null;
  try {
    const res = await fetch(`${apiUrl}/api/v1/pubs/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const raw: unknown = await res.json();
      const unwrapped =
        raw && typeof raw === "object" && "data" in raw
          ? (raw as { data: unknown }).data
          : raw;
      pub = (unwrapped as Pub) || null;
    }
  } catch {
    // fall through with null pub
  }
  return <PubPageClient id={id} initialPub={pub} />;
}
