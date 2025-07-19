"use client";

import Link from "next/link";
import styles from "./NavBar.module.css";
import { useEffect, useState } from "react";

export default function NavBar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    function checkAuth() {
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
    }
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

  function handleLogout() {
    localStorage.removeItem("token");
    setUserEmail(null);
    window.dispatchEvent(new Event("authChanged"));
    // No reload needed, UI will update
  }

  return (
    <nav className={styles.nav}>
      <ul>
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/pubs">All Pubs</Link>
        </li>
        {!userEmail && (
          <li>
            <Link href="/register">Register</Link>
          </li>
        )}
        {userEmail && (
          <li style={{ marginLeft: "auto" }}>
            <span>{userEmail}</span>
            <button onClick={handleLogout} style={{ marginLeft: 8 }}>
              Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
