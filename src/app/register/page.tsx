"use client";

import { useEffect, useState } from "react";
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

export default function RegisterLoginPage() {
  const [redirectTo, setRedirectTo] = useState("/");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const safeReferrer = getSafeInternalPath(document.referrer);
    const prev = safeReferrer && safeReferrer !== "/register" ? safeReferrer : "/";
    const lastUrl = getSafeInternalPath(sessionStorage.getItem("lastUrl"));
    setRedirectTo(lastUrl && lastUrl !== "/register" ? lastUrl : prev);
    sessionStorage.setItem("lastUrl", window.location.pathname);
  }, []);

  function handleLogin() {
    setTimeout(() => { window.location.href = redirectTo || "/"; }, 300);
  }

  return (
    <div className={styles.page}>
      <AuthGate onLogin={handleLogin} />
    </div>
  );
}
