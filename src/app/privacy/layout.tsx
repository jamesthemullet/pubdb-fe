import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the Pub DB Privacy Policy to understand how we collect, use, and protect your data.",
  openGraph: {
    type: "website",
    title: "Privacy Policy | Pub DB",
    description: "Read the Pub DB Privacy Policy to understand how we collect, use, and protect your data.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Pub DB" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Pub DB",
    description: "Read the Pub DB Privacy Policy to understand how we collect, use, and protect your data.",
    images: [{ url: "/og-default.png", alt: "Pub DB" }],
  },
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
