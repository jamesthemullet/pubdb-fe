import Link from "next/link";
import styles from "./topbar.module.css";

export default function Topbar() {
  return (
    <div className={styles.topbar}>
      <Link href="/changelog" className={styles.whatsNew}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M7 1.5l1.35 3.24L11.5 6l-3.15 1.26L7 10.5l-1.35-3.24L2.5 6l3.15-1.26L7 1.5z"
            fill="currentColor"
          />
        </svg>
        What&apos;s new
      </Link>
    </div>
  );
}
