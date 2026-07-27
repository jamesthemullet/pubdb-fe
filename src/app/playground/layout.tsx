import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Playground",
  description: "Try live Pub DB API requests with your own API key.",
  robots: { index: false },
};

export default function PlaygroundLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
