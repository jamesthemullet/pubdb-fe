import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Browse Pubs",
  description:
    "Search and browse thousands of pubs from around the world. Filter by location, amenities, beer types, and more.",
  openGraph: {
    title: "Browse Pubs | Pub DB",
    description:
      "Search and browse thousands of pubs from around the world. Filter by location, amenities, beer types, and more.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Pub DB" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Pubs | Pub DB",
    description:
      "Search and browse thousands of pubs from around the world. Filter by location, amenities, beer types, and more.",
    images: [{ url: "/og-default.png", alt: "Pub DB" }],
  },
};

export default function PubsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
