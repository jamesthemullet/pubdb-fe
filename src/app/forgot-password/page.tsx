"use client";
import { useState } from "react";
import Button from "@/app/components/button/button";
import Input from "@/app/components/input/Input";
import Typography from "@/app/components/typography/typography";
import { API_URL } from "@/lib/apiConfig";
import styles from "./page.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const apiUrl = API_URL;
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.errors || "Unknown error");
      } else {
        setMessage(data.message);
        setEmail(""); // Clear the form
      }
    } catch (_err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <Typography variant="headingMedium">Forgot Password</Typography>
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
        <div className={styles.success} role="status">
          <Typography>{message}</Typography>
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
        <a href="/register">Back to Login</a>
      </div>
    </div>
  );
}
