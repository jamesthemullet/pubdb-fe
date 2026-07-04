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

// TODO: fetch real stats from API before re-enabling stats bar
// const STATS = [
//   { value: "12,418", label: "pubs in production" },
//   { value: "99.98%", label: "uptime, 90 days" },
//   { value: "38ms", label: "p95 response time" },
//   { value: "4.2k", label: "developers using us" },
// ];

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.earlyAccessBanner}>
        <strong>Early access:</strong> Pub DB is under active development. The API and data are subject to change. Expect rough edges.
      </div>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          {/* TODO: replace with real version/pub count/country data from API */}
          {/* <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} aria-hidden="true" />
            v2.4 · 12,418 pubs · 4 new countries
          </div> */}
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

      {/* TODO: re-enable stats bar once real stats are fetched from API */}
      {/* <div className={styles.statsBar}>
        {STATS.map(({ value, label }) => (
          <div key={label} className={styles.statItem}>
            <span className={styles.statValue}>{value}</span>
            <span className={styles.statLabel}>{label}</span>
          </div>
        ))}
      </div> */}

      <section className={styles.contributeSection} aria-label="Contribute to Pub DB">
        <div className={styles.contributeContent}>
          <h2 className={styles.contributeHeading}>Most pubs are in — but the details aren&apos;t.</h2>
          <p className={styles.contributeText}>
            Got a local? Chances are it&apos;s already here, but missing its beer garden, cask ales, or opening hours.
            Browse the database and help us fill in the gaps.
          </p>
          <div className={styles.contributeCtas}>
            <Link href="/pubs" className={styles.ctaPrimary}>
              Find your local →
            </Link>
            <Link href="/add-pub" className={styles.ctaSecondary}>
              Add a missing pub
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.pricingSection} aria-label="Pricing">
        <Pricing />
      </section>
    </div>
  );
}
