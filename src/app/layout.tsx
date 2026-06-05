import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
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
    siteName: "Pub DB",
    title: "Pub DB",
    description:
      "Browse and contribute to probably the world's best database of pubs. Search pubs by name, city, or address.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pub DB",
    description:
      "Browse and contribute to probably the world's best database of pubs. Search pubs by name, city, or address.",
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
      </body>
    </html>
  );
}
