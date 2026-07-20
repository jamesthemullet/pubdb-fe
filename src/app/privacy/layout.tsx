import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Pub DB Privacy Policy.",
  robots: { index: false },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <>{children}</>;
}
