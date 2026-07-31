import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Pub DB account settings, profile, API keys, and preferences.",
  robots: { index: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <>{children}</>;
}
