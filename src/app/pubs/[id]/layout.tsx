import type { Metadata } from "next";
import { getServerApiUrl } from "@/lib/serverApiUrl";

type PubMetaShape = {
  name?: string;
  city?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const fallback: Metadata = {
    title: "Pub Details",
    description:
      "View detailed information about this pub — location, amenities, opening hours, beer selection, and more.",
    openGraph: {
      title: "Pub Details | Pub DB",
      description:
        "View detailed information about this pub — location, amenities, opening hours, beer selection, and more.",
    },
    twitter: {
      title: "Pub Details | Pub DB",
      description:
        "View detailed information about this pub — location, amenities, opening hours, beer selection, and more.",
    },
  };

  try {
    const apiUrl = getServerApiUrl();
    const apiKey = process.env.TESTING_API_KEY;
    const headers: Record<string, string> = apiKey ? { "X-API-Key": apiKey } : {};
    const res = await fetch(`${apiUrl}/api/v1/pubs/${id}`, {
      headers,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return fallback;
    const raw: unknown = await res.json().catch(() => null);
    const pub: PubMetaShape =
      raw && typeof raw === "object" && "data" in raw
        ? (raw as { data: PubMetaShape }).data
        : (raw as PubMetaShape) ?? {};
    if (!pub?.name) return fallback;
    const title = pub.city ? `${pub.name} — ${pub.city}` : pub.name;
    const description = `View details, amenities, opening hours, and more for ${pub.name}${pub.city ? ` in ${pub.city}` : ""}.`;
    return {
      title,
      description,
      openGraph: { title: `${title} | Pub DB`, description },
      twitter: { title: `${title} | Pub DB`, description },
    };
  } catch {
    return fallback;
  }
}

export default function PubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
