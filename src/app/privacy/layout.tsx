import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the Pub DB Privacy Policy to understand how we collect, use, and protect your data.",
  openGraph: {
    title: "Privacy Policy | Pub DB",
    description: "Read the Pub DB Privacy Policy to understand how we collect, use, and protect your data.",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy | Pub DB",
    description: "Read the Pub DB Privacy Policy to understand how we collect, use, and protect your data.",
  },
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
