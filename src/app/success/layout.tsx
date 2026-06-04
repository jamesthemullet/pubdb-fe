import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription Confirmed",
  description: "Your Pub DB subscription has been confirmed.",
  robots: { index: false },
};

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
