import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your Pub DB subscription and billing.",
  robots: { index: false },
};

export default function BillingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
