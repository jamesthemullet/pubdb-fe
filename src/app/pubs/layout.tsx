import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Pubs",
  description:
    "Search and browse thousands of pubs from around the world. Filter by location, amenities, beer types, and more.",
  openGraph: {
    title: "Browse Pubs | Pub DB",
    description:
      "Search and browse thousands of pubs from around the world. Filter by location, amenities, beer types, and more.",
  },
  twitter: {
    title: "Browse Pubs | Pub DB",
    description:
      "Search and browse thousands of pubs from around the world. Filter by location, amenities, beer types, and more.",
  },
};

export default function PubsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
