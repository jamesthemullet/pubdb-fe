"use client";

import Heading from "./components/heading/heading";
import Pricing from "./components/pricing";
import Typography from "./components/typography/typography";

export default function Home() {
  return (
    <>
      <Heading text="Pub DB" />
      <Typography>
        Welcome to Pub DB - probably the best database of pubs in the world.
      </Typography>
      <Pricing />
    </>
  );
}
