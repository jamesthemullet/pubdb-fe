import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the Pub DB Terms of Service governing your use of the platform and API.",
  openGraph: {
    title: "Terms of Service | Pub DB",
    description: "Read the Pub DB Terms of Service governing your use of the platform and API.",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service | Pub DB",
    description: "Read the Pub DB Terms of Service governing your use of the platform and API.",
  },
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
