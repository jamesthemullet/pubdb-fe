import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playground",
  description: "Try live Pub DB API requests with your own API key.",
  robots: { index: false },
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <>{children}</>;
}
