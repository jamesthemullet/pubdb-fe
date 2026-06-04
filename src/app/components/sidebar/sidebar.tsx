"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API_URL } from "@/lib/apiConfig";
import { buildAuthHeaders } from "@/lib/auth";
import styles from "./sidebar.module.css";

type ApiKey = {
  tier: string;
  limits: { requestsPerMonth: number };
  remaining: { month: number };
};

type PlanData = {
  planName: string;
  used: number;
  limit: number;
  pct: number;
};

const WORKSPACE_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/pubs", label: "Browse pubs", badge: "12.4k" },
  { href: "/add-pub", label: "Add pub" },
  { href: "/profile", label: "API keys" },
  { href: "/docs", label: "Docs" },
];

const ACCOUNT_LINKS = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [planData, setPlanData] = useState<PlanData | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!user) { setPlanData(null); return; }
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/auth/dashboard`, { headers: buildAuthHeaders(token) })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { apiKeys: ApiKey[] }) => {
        const keys = data.apiKeys ?? [];
        if (keys.length === 0) return;
        const used = keys.reduce((s, k) => s + (k.limits.requestsPerMonth - k.remaining.month), 0);
        const limit = keys.reduce((s, k) => s + k.limits.requestsPerMonth, 0);
        const tier = keys[0].tier ?? "";
        const planName = `${tier.charAt(0).toUpperCase()}${tier.slice(1).toLowerCase()} plan`;
        setPlanData({ planName, used, limit, pct: limit > 0 ? Math.round((used / limit) * 100) : 0 });
      })
      .catch(() => setPlanData(null));
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("authChanged"));
    setMenuOpen(false);
  };

  const userInitials = user?.email.slice(0, 2).toUpperCase() ?? null;

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                router.push(`/pubs?q=${encodeURIComponent(searchQuery.trim())}`);
                setMenuOpen(false);
              }
            }}
          />
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
                  className={`${styles.navItem} ${pathname === href ? styles.navItemActive : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className={styles.navLabel}>{label}</span>
                </Link>
              </li>
            ))}
            {!user ? (
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

        {planData && (
          <div className={styles.planCard}>
            <div className={styles.planCardTop}>
              <span className={styles.planName}>{planData.planName}</span>
              <span className={styles.planPct}>{planData.pct}% used</span>
            </div>
            <div className={styles.planBar}>
              <div className={styles.planBarFill} style={{ width: `${planData.pct}%` }} />
            </div>
            <p className={styles.planRequests}>
              {planData.used.toLocaleString()} / {planData.limit.toLocaleString()} requests<br />this month
            </p>
            <Link
              href="/profile"
              className={styles.upgradeBtn}
              onClick={() => setMenuOpen(false)}
            >
              Upgrade plan
            </Link>
          </div>
        )}

        {userInitials && (
          <div className={styles.userRow}>
            <span className={styles.userAvatar}>{userInitials}</span>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
        )}
      </aside>
    </>
  );
}
