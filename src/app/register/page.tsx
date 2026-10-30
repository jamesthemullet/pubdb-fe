"use client";

import { useEffect, useRef, useState } from "react";
import AuthGate from "@/app/components/auth-gate/AuthGate";
import { getRedirectFromSearch, getSafeRedirectPath } from "@/lib/loginRedirect";
import styles from "./page.module.css";

export default function RegisterLoginPage(){
  const [redirectTo, setRedirectTo] = useState("/");
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const { origin, search } = window.location;
    // Prefer an explicit ?redirect= (set by "Log in" links), falling back to the
    // referrer, which is only meaningful after a full page load.
    setRedirectTo(
      getRedirectFromSearch(search, origin) ?? getSafeRedirectPath(document.referrer, origin) ?? "/",
    );
  }, []);

  useEffect(() => {
    return () => clearTimeout(redirectTimeoutRef.current);
  }, []);

  function handleLogin() {
    redirectTimeoutRef.current = setTimeout(() => {
      if (typeof window !== "undefined") window.location.href = redirectTo || "/";
    }, 300);
  }

  return (
    <div className={styles.page}>
      <AuthGate onLogin={handleLogin} headingLevel={1} />
    </div>
  );
}
