"use client";

import { useEffect, useRef, useState } from "react";
import AuthGate from "@/app/components/auth-gate/AuthGate";
import styles from "./page.module.css";

const getSafeInternalPath = (value: string | null | undefined): string | null => {
  if (!value || typeof window === "undefined") return null;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!url.pathname.startsWith("/")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
};

export default function RegisterLoginPage(){
  const [redirectTo, setRedirectTo] = useState("/");
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const safeReferrer = getSafeInternalPath(document.referrer);
    const prev = safeReferrer && safeReferrer !== "/register" ? safeReferrer : "/";
    const lastUrl = getSafeInternalPath(sessionStorage.getItem("lastUrl"));
    setRedirectTo(lastUrl && lastUrl !== "/register" ? lastUrl : prev);
    sessionStorage.setItem("lastUrl", window.location.pathname);
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
