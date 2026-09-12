import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Verify Your Email",
  description: "Confirm your Pub DB account email address.",
  robots: { index: false },
};

export default function VerifyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
