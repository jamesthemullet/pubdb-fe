import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation",
  description:
    "Explore the Pub DB REST API. Access over 12,000 pubs with a simple API key. Quickstart guides, endpoint reference, and code examples.",
  openGraph: {
    title: "API Documentation | Pub DB",
    description:
      "Explore the Pub DB REST API. Access over 12,000 pubs with a simple API key. Quickstart guides, endpoint reference, and code examples.",
  },
  twitter: {
    title: "API Documentation | Pub DB",
    description:
      "Explore the Pub DB REST API. Access over 12,000 pubs with a simple API key. Quickstart guides, endpoint reference, and code examples.",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <>{children}</>;
}
