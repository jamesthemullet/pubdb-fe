import type { Metadata } from "next";
import type { ReactNode } from "react";
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
  const ogImage = [{ url: "/og-default.png", width: 1200, height: 630, alt: "Pub DB" }];
  const fallback: Metadata = {
    title: "Pub Details",
    description:
      "View detailed information about this pub — location, amenities, opening hours, beer selection, and more.",
    openGraph: {
      title: "Pub Details | Pub DB",
      description:
        "View detailed information about this pub — location, amenities, opening hours, beer selection, and more.",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: "Pub Details | Pub DB",
      description:
        "View detailed information about this pub — location, amenities, opening hours, beer selection, and more.",
      images: ["/og-default.png"],
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
      raw !== null && typeof raw === "object" && !Array.isArray(raw)
        ? "data" in raw
          ? (raw as { data: PubMetaShape }).data
          : (raw as PubMetaShape)
        : {};
    if (!pub?.name) return fallback;
    const title = pub.city ? `${pub.name} — ${pub.city}` : pub.name;
    const description = `View details, amenities, opening hours, and more for ${pub.name}${pub.city ? ` in ${pub.city}` : ""}.`;
    return {
      title,
      description,
      openGraph: {
        title: `${title} | Pub DB`,
        description,
        images: ogImage,
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | Pub DB`,
        description,
        images: ["/og-default.png"],
      },
    };
  } catch {
    return fallback;
  }
}

export default function PubLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
