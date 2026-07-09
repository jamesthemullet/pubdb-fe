"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import { Suspense, useEffect, useState } from "react";
import Button from "@/app/components/button/button";
import Input from "@/app/components/input/Input";
import Typography from "@/app/components/typography/typography";
import { API_URL } from "@/lib/apiConfig";
import styles from "./page.module.css";

function ResetPasswordForm(): ReactElement {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const apiUrl = API_URL;
      const res = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.errors || "Unknown error");
      } else {
        setMessage(data.message);
        setPassword("");
        setConfirmPassword("");
      }
    } catch (_err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className={styles.container}>
        <Typography variant="headingMedium">Invalid Reset Link</Typography>
        <Typography>
          This password reset link is invalid or has expired.
        </Typography>
        <div className={styles.invalidLink}>
          <Link href="/forgot-password">Request a new password reset</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Typography variant="headingMedium">Reset Password</Typography>
      <Typography>Enter your new password below.</Typography>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="new-password" className={styles.label}>
          New Password:
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        <label htmlFor="confirm-password" className={styles.label}>
          Confirm Password:
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        <Button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>

      {message && (
        <div className={styles.success}>
          <Typography>{message}</Typography>
          <div className={styles.successLink}>
            <Link href="/register">Go to Login</Link>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.error} role="alert">
          <Typography>
            {typeof error === "string" ? error : JSON.stringify(error)}
          </Typography>
        </div>
      )}

      <div className={styles.backLink}>
        <Link href="/register">Back to Login</Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage(): ReactElement {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
