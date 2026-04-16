import { Suspense } from "react";
import Heading from "./components/heading/heading";
import Typography from "./components/typography/typography";
import Pricing from "./features/pricing/pricing";

export default function Home() {
  return (
    <>
      <Heading text="Pub DB" />
      <Typography>
        Welcome to Pub DB - probably the best database of pubs in the world.
      </Typography>
      <Suspense fallback={<Typography>Loading pricing…</Typography>}>
        <Pricing />
      </Suspense>
    </>
  );
}
