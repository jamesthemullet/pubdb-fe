import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Add a Pub",
  description: "Contribute to the Pub DB database by adding a new pub. Help build the world's best pub database.",
  openGraph: {
    title: "Add a Pub | Pub DB",
    description: "Contribute to the Pub DB database by adding a new pub. Help build the world's best pub database.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Pub DB" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Add a Pub | Pub DB",
    description: "Contribute to the Pub DB database by adding a new pub. Help build the world's best pub database.",
    images: [{ url: "/og-default.png", alt: "Pub DB" }],
  },
};

export default function AddPubLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
