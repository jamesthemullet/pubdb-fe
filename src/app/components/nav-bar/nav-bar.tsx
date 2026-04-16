"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "../button/button";
import Typography from "../typography/typography";
import styles from "./nav-bar.module.css";

const NavBar = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthState = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserEmail(data.email || null);
        } else {
          setUserEmail(null);
        }
      } catch {
        setUserEmail(null);
      }
    };

    void fetchAuthState();
    window.addEventListener("authChanged", fetchAuthState);
    return () => {
      window.removeEventListener("authChanged", fetchAuthState);
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
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
