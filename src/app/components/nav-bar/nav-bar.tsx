"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "../button/button";
import Typography from "../typography/typography";
import styles from "./nav-bar.module.css";

const NavBar = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
  };

  return (
    <nav className={styles.nav}>
      <ul>
        <Link href="/">Home</Link>
        <Link href="/pubs">All Pubs</Link>
        <Link href="/profile">Profile</Link>
        <Link href="/add-pub">Add Pub</Link>
        {!userEmail && <Link href="/register">Register</Link>}
        {userEmail && (
          <>
            <Typography>{userEmail}</Typography>
            <Button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </Button>
          </>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;
