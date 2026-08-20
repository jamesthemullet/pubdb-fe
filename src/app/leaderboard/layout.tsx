import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "See who has contributed the most to the Pub DB database. Rankings by pubs added across different time periods.",
  openGraph: {
    title: "Leaderboard | Pub DB",
    description:
      "See who has contributed the most to the Pub DB database. Rankings by pubs added across different time periods.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leaderboard | Pub DB",
    description:
      "See who has contributed the most to the Pub DB database. Rankings by pubs added across different time periods.",
    images: [{ url: "/og-default.png", alt: "Pub DB" }],
  },
};

export default function LeaderboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
