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

export function DocNav(){
  return (
    <nav className={styles.docsNav} aria-label="Documentation navigation">
      <ul className={styles.navList}>
        {NAV_ITEMS.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={styles.navItem}
            >
              {label}
            </a>
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
