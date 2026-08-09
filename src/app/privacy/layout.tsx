import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Pub DB Privacy Policy.",
  openGraph: {
    type: "website",
    title: "Privacy Policy | Pub DB",
    description: "Pub DB Privacy Policy.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Pub DB" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Pub DB",
    description: "Pub DB Privacy Policy.",
    images: ["/og-default.png"],
  },
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
