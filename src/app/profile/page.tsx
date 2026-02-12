"use client";

import Dashboard from "../features/dashboard";
import Heading from "../components/heading/heading";
import Typography from "../components/typography/typography";

export default function ProfilePage() {
  return (
    <>
      <Heading text="Profile" />
      <Typography>Manage your API access and account details.</Typography>
      <Dashboard />
    </>
  );
}
