import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your Pub DB subscription and billing.",
  robots: { index: false },
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
