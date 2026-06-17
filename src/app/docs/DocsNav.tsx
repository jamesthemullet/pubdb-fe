"use client";

import { useState } from "react";
import styles from "./page.module.css";

const NAV_ITEMS = [
  { id: "quick-start", label: "Quick start" },
  { id: "authentication", label: "Authentication" },
  { id: "endpoints", label: "Endpoints" },
  { id: "filtering", label: "Filtering & search" },
  { id: "pagination", label: "Pagination" },
  { id: "rate-limits", label: "Rate limits" },
  { id: "errors", label: "Errors" },
];

export default function DocsNav() {
  const [activeSection, setActiveSection] = useState("quick-start");

  const scrollTo = (id: string): void => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className={styles.docsNav} aria-label="Documentation navigation">
      <ul className={styles.navList}>
        {NAV_ITEMS.map(({ id, label }) => (
          <li key={id}>
            <button
              type="button"
              className={`${styles.navItem} ${activeSection === id ? styles.navItemActive : ""}`}
              onClick={() => scrollTo(id)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.needHelp}>
        <p className={styles.needHelpTitle}>Need help?</p>
        <p className={styles.needHelpText}>
          Reach us at{" "}
          <a href="mailto:hello@thepubdb.com" className={styles.needHelpLink}>
            hello@thepubdb.com
          </a>
        </p>
      </div>
    </nav>
  );
}
