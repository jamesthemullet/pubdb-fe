import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Pub DB Terms of Service.",
  robots: { index: false },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
