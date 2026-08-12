import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Pub DB account settings, profile, API keys, and preferences.",
  robots: { index: false },
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
