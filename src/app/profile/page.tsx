"use client";

import Heading from "../components/heading/heading";
import Typography from "../components/typography/typography";
import Dashboard from "../features/dashboard/dashboard";

export default function ProfilePage() {
  return (
    <>
      <Heading text="Profile" />
      <Typography>Manage your API access and account details.</Typography>
      <Dashboard />
    </>
  );
}
