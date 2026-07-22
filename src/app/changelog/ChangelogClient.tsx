import type { ChangelogEntryType, ChangelogVersion } from "@/lib/normalizeChangelog";
import styles from "./page.module.css";

const TYPE_LABEL: Record<ChangelogEntryType, string> = {
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
};

function TypeBadge({ type }: { type: ChangelogEntryType }) {
  return (
    <span className={`${styles.typeBadge} ${styles[`type${type}`]}`}>
      {TYPE_LABEL[type]}
    </span>
  );
}

function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function VersionEntry({ entry }: { entry: ChangelogVersion }) {
  return (
    <div className={styles.versionEntry}>
      <div className={styles.versionRail}>
        <span className={styles.versionDot} aria-hidden="true" />
        <span className={styles.versionLine} aria-hidden="true" />
      </div>
      <div className={styles.versionBody}>
        <div className={styles.versionHeader}>
          <code className={styles.versionTag}>v{entry.version}</code>
          <span className={styles.versionDate}>{formatDate(entry.date)}</span>
        </div>
        <ul className={styles.itemList}>
          {entry.items.map((item) => (
            <li key={`${item.type}-${item.text}`} className={styles.itemRow}>
              <TypeBadge type={item.type} />
              <span className={styles.itemText}>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function ChangelogClient({ versions }: { versions: ChangelogVersion[] }) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Changelog</h1>
            <span className={styles.endpointBadge}>GET /v1/changelog</span>
          </div>
          <p className={styles.description}>
            Every notable change to the Pub DB API, newest first.
          </p>
        </div>
      </div>

      {versions.length === 0 ? (
        <div className={styles.empty}>No changelog entries yet.</div>
      ) : (
        <div className={styles.timeline}>
          {versions.map((entry) => (
            <VersionEntry key={entry.version} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
