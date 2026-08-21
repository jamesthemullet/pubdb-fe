import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the Pub DB Terms of Service governing your use of the platform and API.",
  openGraph: {
    type: "website",
    title: "Terms of Service | Pub DB",
    description: "Read the Pub DB Terms of Service governing your use of the platform and API.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Pub DB" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Pub DB",
    description: "Read the Pub DB Terms of Service governing your use of the platform and API.",
    images: ["/og-default.png"],
  },
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
