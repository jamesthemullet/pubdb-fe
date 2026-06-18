import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in or create a Pub DB account to get an API key and start accessing pub data.",
  openGraph: {
    title: "Sign In | Pub DB",
    description: "Sign in or create a Pub DB account to get an API key and start accessing pub data.",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
