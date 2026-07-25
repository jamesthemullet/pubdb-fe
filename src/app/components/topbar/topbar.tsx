"use client";

import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import styles from "./topbar.module.css";

export default function Topbar() {
  const { theme, toggleTheme } = useTheme();

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
      <button
        type="button"
        className={styles.themeToggle}
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? (
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M7 0.5v1.5M7 12v1.5M13.5 7H12M2 7H0.5M11.6 2.4l-1.06 1.06M3.46 10.54l-1.06 1.06M11.6 11.6l-1.06-1.06M3.46 3.46L2.4 2.4"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M12.5 8.7A5.5 5.5 0 015.3 1.5a5.5 5.5 0 107.2 7.2z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
