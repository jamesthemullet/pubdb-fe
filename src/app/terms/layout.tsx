import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Pub DB Terms of Service.",
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
