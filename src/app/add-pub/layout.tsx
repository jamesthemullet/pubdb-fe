import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add a Pub",
  description: "Contribute to the Pub DB database by adding a new pub. Help build the world's best pub database.",
  openGraph: {
    title: "Add a Pub | Pub DB",
    description: "Contribute to the Pub DB database by adding a new pub. Help build the world's best pub database.",
  },
};

export default function AddPubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
