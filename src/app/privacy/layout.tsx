import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Pub DB Privacy Policy.",
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
