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
    title: "Changelog | Pub DB",
    description: "Every notable change to the Pub DB API, newest first.",
  },
};

export default function ChangelogLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
