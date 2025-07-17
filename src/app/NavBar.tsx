"use client";

import Link from "next/link";
import styles from "./NavBar.module.css";
import { useSession, signIn, signOut } from "next-auth/react";

export default function NavBar() {
  const { data: session, status } = useSession();
  return (
    <nav className={styles.nav}>
      <ul>
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/pubs">All Pubs</Link>
        </li>
        {/* Add more links as needed */}
        <li style={{ marginLeft: "auto" }}>
          {status === "loading" ? (
            <span>Loading…</span>
          ) : session ? (
            <>
              <span>
                Signed in as {session.user?.name || session.user?.email}
              </span>
              <button onClick={() => signOut()} style={{ marginLeft: 8 }}>
                Sign out
              </button>
            </>
          ) : (
            <button onClick={() => signIn()}>Sign in</button>
          )}
        </li>
      </ul>
    </nav>
  );
}
