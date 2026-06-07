import type { Metadata } from "next";

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
    title: "Leaderboard | Pub DB",
    description:
      "See who has contributed the most to the Pub DB database. Rankings by pubs added across different time periods.",
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
