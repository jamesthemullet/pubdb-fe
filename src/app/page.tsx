import type { Metadata } from "next";
import Heading from "./components/heading/heading";
import Typography from "./components/typography/typography";
import Pricing from "./features/pricing/pricing";

export const metadata: Metadata = {
  title: {
    absolute: "Pub DB",
  },
  description:
    "Browse and contribute to probably the world's best database of pubs. Search pubs by name, city, or address.",
  openGraph: {
    title: "Pub DB",
    description:
      "Browse and contribute to probably the world's best database of pubs. Search pubs by name, city, or address.",
  },
};

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
