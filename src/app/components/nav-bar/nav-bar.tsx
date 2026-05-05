"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "../button/button";
import Typography from "../typography/typography";
import styles from "./nav-bar.module.css";

const NavBar = () => {
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
    // Listen for storage changes (cross-tab and same tab)
    window.addEventListener("storage", checkAuth);
    // Listen for custom authChanged event
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

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className={styles.nav}>
      <button
        className={styles.burger}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerLineTopOpen : ""}`} />
        <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerLineMidOpen : ""}`} />
        <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerLineBottomOpen : ""}`} />
      </button>
      <ul className={menuOpen ? styles.menuOpen : ""}>
        <li><Link href="/" onClick={closeMenu}>Home</Link></li>
        <li><Link href="/pubs" onClick={closeMenu}>All Pubs</Link></li>
        <li><Link href="/profile" onClick={closeMenu}>Profile</Link></li>
        <li><Link href="/add-pub" onClick={closeMenu}>Add Pub</Link></li>
        <li><Link href="/leaderboard" onClick={closeMenu}>Leaderboard</Link></li>
        {!userEmail && <li><Link href="/register" onClick={closeMenu}>Register</Link></li>}
        {userEmail && (
          <>
            <li><Typography>{userEmail}</Typography></li>
            <li>
              <Button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </Button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;
