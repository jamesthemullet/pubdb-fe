"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import { Suspense, useEffect, useState } from "react";
import Typography from "@/app/components/typography/typography";
import styles from "./page.module.css";

function VerifyContent(): ReactElement {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("This verification link is missing a token.");
      setLoading(false);
      return;
    }

    async function verify(verificationToken: string) {
      try {
        const response = await fetch(
          `/api/auth/verify?token=${encodeURIComponent(verificationToken)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || "Verification failed");
        }

        setMessage(data.message);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to verify your email"
        );
      } finally {
        setLoading(false);
      }
    }

    verify(token);
  }, [token]);

  if (loading) {
    return (
      <div className={styles.centered}>
        <Typography variant="headingMedium" as="h1">Verifying your email...</Typography>
        <Typography>Please wait a moment.</Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centered}>
        <div className={styles.icon} aria-hidden="true">❌</div>
        <Typography variant="headingMedium" as="h1" className={styles.headingError}>
          Verification Failed
        </Typography>
        <Typography className={styles.message}>{error}</Typography>
        <div className={styles.actions}>
          <Link href="/register" className={styles.btn}>Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.centered}>
      <div className={styles.icon} aria-hidden="true">✅</div>
      <Typography variant="headingMedium" as="h1" className={styles.headingSuccess}>
        Email Verified
      </Typography>
      <Typography className={styles.message}>{message}</Typography>
      <div className={styles.actions}>
        <Link href="/register" className={styles.btn}>Go to Login</Link>
      </div>
    </div>
  );
}

export default function VerifyPage(): ReactElement {
  return (
    <Suspense fallback={<div className={styles.centered}>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
