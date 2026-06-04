// TODO: settings page is not ready — hidden from nav until wired to real API.
// Re-enable sidebar link in src/app/components/sidebar/sidebar.tsx when done.
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Pub DB account settings, profile, API keys, and preferences.",
  robots: { index: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  redirect("/");
  return <>{children}</>;
}
