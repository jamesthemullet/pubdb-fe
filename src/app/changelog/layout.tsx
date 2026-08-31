import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Every notable change to the Pub DB API, newest first.",
  openGraph: {
    title: "Changelog | Pub DB",
    description: "Every notable change to the Pub DB API, newest first.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog | Pub DB",
    description: "Every notable change to the Pub DB API, newest first.",
    images: [{ url: "/og-default.png", alt: "Pub DB" }],
  },
};

export default function ChangelogLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
