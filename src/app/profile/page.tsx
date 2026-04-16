import type { Metadata } from "next";
import Heading from "../components/heading/heading";
import Typography from "../components/typography/typography";
import Dashboard from "../features/dashboard/dashboard";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your Pub DB API access, subscription, and account details.",
};

export default function ProfilePage() {
  return (
    <>
      <Heading text="Profile" />
      <Typography>Manage your API access and account details.</Typography>
      <Dashboard />
    </>
  );
}
