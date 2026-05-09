"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./sidebar.module.css";

const WORKSPACE_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/pubs", label: "Browse pubs", badge: "12.4k" },
  { href: "/profile", label: "API keys" },
  { href: "/docs", label: "Docs" },
  { href: "/add-pub", label: "Add pub" },
];

const ACCOUNT_LINKS = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile", label: "Billing" },
  { href: "/profile", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUserEmail(payload.email || null);
        } catch {
          setUserEmail(null);
        }
      } else {
        setUserEmail(null);
      }
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("authChanged", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("authChanged", checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUserEmail(null);
    window.dispatchEvent(new Event("authChanged"));
    setMenuOpen(false);
  };

  const userInitials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : null;

  return (
    <>
      <button
        type="button"
        className={styles.mobileBar}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <span className={styles.mobileLogo}>Pub DB</span>
        <span className={styles.burgerIcon}>
          <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerLineTopOpen : ""}`} />
          <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerLineMidOpen : ""}`} />
          <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerLineBottomOpen : ""}`} />
        </span>
      </button>

      {menuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.logoRow}>
          <div className={styles.logoIcon}>P</div>
          <span className={styles.logoText}>Pub DB</span>
          <span className={styles.logoVersion}>v2.4</span>
        </div>

        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search pubs, endpoints, docs..."
            aria-label="Search"
          />
          <kbd className={styles.searchKbd}>⌘K</kbd>
        </div>

        <nav aria-label="Workspace navigation">
          <p className={styles.navSection}>WORKSPACE</p>
          <ul className={styles.navList}>
            {WORKSPACE_LINKS.map(({ href, label, badge }) => (
              <li key={label}>
                <Link
                  href={href}
                  className={`${styles.navItem} ${pathname === href ? styles.navItemActive : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navLabel}>{label}</span>
                  {badge && <span className={styles.navBadge}>{badge}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Account navigation">
          <p className={styles.navSection}>ACCOUNT</p>
          <ul className={styles.navList}>
            {ACCOUNT_LINKS.map(({ href, label }) => (
              <li key={label}>
                <Link
                  href={href}
                  className={`${styles.navItem} ${pathname === href && label === "Leaderboard" ? styles.navItemActive : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navLabel}>{label}</span>
                </Link>
              </li>
            ))}
            {!userEmail ? (
              <li>
                <Link
                  href="/register"
                  className={`${styles.navItem} ${pathname === "/register" ? styles.navItemActive : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navLabel}>Register / Log in</span>
                </Link>
              </li>
            ) : (
              <li>
                <button
                  type="button"
                  className={`${styles.navItem} ${styles.navItemBtn}`}
                  onClick={handleLogout}
                >
                  <span className={styles.navLabel}>Log out</span>
                </button>
              </li>
            )}
          </ul>
        </nav>

        <div className={styles.spacer} />

        <div className={styles.planCard}>
          <div className={styles.planCardTop}>
            <span className={styles.planName}>Developer plan</span>
            <span className={styles.planPct}>42% used</span>
          </div>
          <div className={styles.planBar}>
            <div className={styles.planBarFill} />
          </div>
          <p className={styles.planRequests}>
            42,318 / 100,000 requests<br />this month
          </p>
          <Link
            href="/profile"
            className={styles.upgradeBtn}
            onClick={() => setMenuOpen(false)}
          >
            Upgrade plan
          </Link>
        </div>

        {userInitials && (
          <div className={styles.userRow}>
            <span className={styles.userAvatar}>{userInitials}</span>
            <span className={styles.userEmail}>{userEmail}</span>
          </div>
        )}
      </aside>
    </>
  );
}
