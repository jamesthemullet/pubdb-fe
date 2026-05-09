import type { Metadata } from "next";
import Link from "next/link";
import HeroCodeBlock from "./features/homepage/hero-code-block";
import Pricing from "./features/pricing/pricing";
import styles from "./page.module.css";

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

const STATS = [
  { value: "12,418", label: "pubs in production" },
  { value: "99.98%", label: "uptime, 90 days" },
  { value: "38ms", label: "p95 response time" },
  { value: "4.2k", label: "developers using us" },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} aria-hidden="true" />
            v2.4 · 12,418 pubs · 4 new countries
          </div>
          <h1 className={styles.heroHeading}>
            The pub database
            <br />
            <em className={styles.heroAccent}>that drinks with you.</em>
          </h1>
          <p className={styles.heroDescription}>
            A clean REST API for every pub, garden, cask line and Sunday roast
            across the UK and Ireland. Built for apps that help people find a
            decent pint.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/register" className={styles.ctaPrimary}>
              Get an API key →
            </Link>
            <Link href="/pubs" className={styles.ctaSecondary}>
              Browse pubs
            </Link>
            <span className={styles.ctaNote}>Free tier · 1,000 requests/mo</span>
          </div>
        </div>
        <div className={styles.heroCode}>
          <HeroCodeBlock />
        </div>
      </section>

      <div className={styles.statsBar}>
        {STATS.map(({ value, label }) => (
          <div key={label} className={styles.statItem}>
            <span className={styles.statValue}>{value}</span>
            <span className={styles.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      <div className={styles.pricingSection}>
        <Pricing />
      </div>
    </div>
  );
}
