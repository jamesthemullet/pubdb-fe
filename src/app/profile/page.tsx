import type { Metadata } from "next";
import Dashboard from "../features/dashboard/dashboard";

export const metadata: Metadata = {
  title: "API keys",
  description: "Manage your Pub DB API keys, track usage, and review activity.",
  robots: { index: false },
};

export default function ProfilePage() {
  return <Dashboard />;
}
