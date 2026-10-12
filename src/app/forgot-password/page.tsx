"use client";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import styles from "./page.module.css";

export default function ForgotPasswordPage(){
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data: unknown = await res.json();
      const body =
        typeof data === "object" && data !== null
          ? (data as Record<string, unknown>)
          : {};

      if (!res.ok) {
        const errMsg =
          typeof body.error === "string"
            ? body.error
            : typeof body.errors === "string"
              ? body.errors
              : "Unknown error";
        setError(errMsg);
      } else {
        setMessage(typeof body.message === "string" ? body.message : null);
        setEmail("");
      }
    } catch (_err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <h1 className={styles.title}>Forgot Password</h1>
        <p className={styles.subtitle}>
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldBlock}>
            <label className={styles.label} htmlFor="forgot-email">
              Email
            </label>
            <input
              id="forgot-email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ada@example.com"
              autoComplete="email"
              required
            />
          </div>

          {error && (
            <div role="alert" className={styles.errorBox}>
              {typeof error === "string" ? error : JSON.stringify(error)}
            </div>
          )}

          {message && <output className={styles.successBox}>{message}</output>}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className={styles.divider} />

        <p className={styles.switchText}>
          <Link href="/register" className={styles.switchLink}>
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
