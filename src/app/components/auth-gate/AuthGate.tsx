"use client";

import Link from "next/link";
import { useState } from "react";
import { API_URL } from "@/lib/apiConfig";
import styles from "./AuthGate.module.css";

type AuthGateProps = {
  /** Shown above the form to explain why sign-in is needed. */
  context?: string;
  /** Called after a successful login so the parent can re-check auth. */
  onLogin?: () => void;
};

export default function AuthGate({ context, onLogin }: AuthGateProps) {
  const [mode, setMode] = useState<"register" | "login">("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const endpoint = mode === "register" ? "/register" : "/login";
      const body = mode === "register" ? { name, username, email, password } : { email, password };
      const res = await fetch(`${API_URL}/auth${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.errors || "Unknown error");
      } else if (mode === "login" && data.token) {
        localStorage.setItem("token", data.token);
        window.dispatchEvent(new Event("authChanged"));
        onLogin?.();
      } else {
        setSuccess("Registration successful! Check your email to verify your account.");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: "register" | "login"): void {
    setMode(next);
    setError(null);
    setSuccess(null);
  }

  return (
    <div className={styles.wrap}>
      {context && <p className={styles.context}>{context}</p>}

      <h2 className={styles.title}>
        {mode === "register" ? "Create an account" : "Log in"}
      </h2>

      {mode === "register" && (
        <p className={styles.subtitle}>
          Get a free API key with 1,000 requests/month. No credit card required.
        </p>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        {mode === "register" && (
          <div className={styles.fieldRow2}>
            <div className={styles.fieldBlock}>
              <label className={styles.label} htmlFor="ag-name">Name</label>
              <input
                id="ag-name"
                className={styles.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                autoComplete="name"
                required
              />
            </div>
            <div className={styles.fieldBlock}>
              <label className={styles.label} htmlFor="ag-username">Username</label>
              <input
                id="ag-username"
                className={styles.input}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ada"
                autoComplete="username"
                required
                spellCheck={false}
              />
            </div>
          </div>
        )}

        <div className={styles.fieldBlock}>
          <label className={styles.label} htmlFor="ag-email">Email</label>
          <input
            id="ag-email"
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ada@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div className={styles.fieldBlock}>
          <div className={styles.passwordLabelRow}>
            <label className={styles.label} htmlFor="ag-password">Password</label>
            {mode === "login" && (
              <Link href="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            )}
          </div>
          <input
            id="ag-password"
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            required
          />
          {mode === "register" && (
            <p className={styles.inputHint}>Must be at least 8 characters with one number</p>
          )}
        </div>

        {error && (
          <div role="alert" className={styles.errorBox}>
            {typeof error === "string" ? error : JSON.stringify(error)}
          </div>
        )}
        {success && (
          <div role="alert" className={styles.successBox}>
            <p>{success}</p>
          </div>
        )}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Please wait…" : mode === "register" ? "Create account" : "Log in"}
        </button>

        {mode === "register" && (
          <p className={styles.termsText}>
            By creating an account you agree to our{" "}
            <Link href="/terms" className={styles.termsLink}>Terms of Service</Link>{" "}
            and <Link href="/privacy" className={styles.termsLink}>Privacy Policy</Link>.
          </p>
        )}
      </form>

      <div className={styles.divider} />

      <p className={styles.switchText}>
        {mode === "register" ? (
          <>
            Already have an account?{" "}
            <button type="button" className={styles.switchLink} onClick={() => switchMode("login")}>
              Log in
            </button>
          </>
        ) : (
          <>
            New to Pub DB?{" "}
            <button type="button" className={styles.switchLink} onClick={() => switchMode("register")}>
              Create an account
            </button>
          </>
        )}
      </p>
    </div>
  );
}
