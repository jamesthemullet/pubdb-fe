import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Pub DB Terms of Service.",
  openGraph: {
    type: "website",
    title: "Terms of Service | Pub DB",
    description: "Pub DB Terms of Service.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Pub DB" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Pub DB",
    description: "Pub DB Terms of Service.",
    images: ["/og-default.png"],
  },
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
