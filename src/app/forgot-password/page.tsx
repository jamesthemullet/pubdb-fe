"use client";
import Link from "next/link";
import { useState } from "react";
import Button from "@/app/components/button/button";
import Input from "@/app/components/input/Input";
import Typography from "@/app/components/typography/typography";
import styles from "./page.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
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
    <div className={styles.container}>
      <Typography variant="headingMedium" as="h1">Forgot Password</Typography>
      <Typography className={styles.description}>
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </Typography>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="forgot-email" className={styles.label}>
          Email:
          <Input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <Button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      {message && (
        <output className={styles.success}>
          <Typography>{message}</Typography>
        </output>
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
