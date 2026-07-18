import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AccentedInit from "./components/AccentedInit";
import Sidebar from "./components/sidebar/sidebar";
import styles from "./layout.module.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Pub DB",
    default: "Pub DB",
  },
  description:
    "Browse and contribute to probably the world's best database of pubs. Search pubs by name, city, or address.",
  openGraph: {
    type: "website",
    url: "https://www.thepubdb.com",
    siteName: "Pub DB",
    title: "Pub DB",
    description:
      "Browse and contribute to probably the world's best database of pubs. Search pubs by name, city, or address.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Pub DB" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pub DB",
    description:
      "Browse and contribute to probably the world's best database of pubs. Search pubs by name, city, or address.",
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${jetbrainsMono.variable}`}
      >
        <a href="#main-content" className={styles.skipLink}>
          Skip to main content
        </a>
        <div className={styles.appShell}>
          <Sidebar />
          <div className={styles.contentArea}>
            <main id="main-content" className={styles.main}>
              {children}
            </main>
          </div>
        </div>
        <Analytics />
        <AccentedInit />
      </body>
    </html>
  );
}
