"use client";

import Dashboard from "./components/Dashboard";
import Pricing from "./components/pricing";

export default function Home() {
  return (
    <>
      <h2>Pub DB</h2>
      <Dashboard />
      <Pricing />
    </>
  );
}
