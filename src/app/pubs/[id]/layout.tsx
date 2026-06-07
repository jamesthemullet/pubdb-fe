import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pub Details",
  description: "View detailed information about this pub — location, amenities, opening hours, beer selection, and more.",
  openGraph: {
    title: "Pub Details | Pub DB",
    description: "View detailed information about this pub — location, amenities, opening hours, beer selection, and more.",
  },
  twitter: {
    title: "Pub Details | Pub DB",
    description: "View detailed information about this pub — location, amenities, opening hours, beer selection, and more.",
  },
};

export default function PubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
