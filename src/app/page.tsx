"use client";

import Dashboard from "./features/dashboard";
import Pricing from "./components/pricing";
import Heading from "./components/heading/heading";
import Typography from "./components/typography/typography";

export default function Home() {
  return (
    <>
      <Heading text="Pub DB" />
      <Typography>Welcome to Pub DB</Typography>

      <Dashboard />
      <Pricing />
    </>
  );
}
