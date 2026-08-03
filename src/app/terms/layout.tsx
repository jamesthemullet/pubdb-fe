import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Pub DB Terms of Service.",
};

export default function TermsLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <>{children}</>;
}
