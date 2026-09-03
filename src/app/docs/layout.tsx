import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "API Documentation",
  description:
    "Explore the Pub DB REST API. Access over 12,000 pubs with a simple API key. Quickstart guides, endpoint reference, and code examples.",
  openGraph: {
    title: "API Documentation | Pub DB",
    description:
      "Explore the Pub DB REST API. Access over 12,000 pubs with a simple API key. Quickstart guides, endpoint reference, and code examples.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Pub DB" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "API Documentation | Pub DB",
    description:
      "Explore the Pub DB REST API. Access over 12,000 pubs with a simple API key. Quickstart guides, endpoint reference, and code examples.",
    images: [{ url: "/og-default.png", alt: "Pub DB" }],
  },
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
