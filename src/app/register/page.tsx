"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Input from "@/app/components/input/Input";
import Typography from "@/app/components/typography/typography";
import { API_URL } from "@/lib/apiConfig";
import styles from "./page.module.css";

const getSafeInternalPath = (
  value: string | null | undefined
): string | null => {
  if (!value || typeof window === "undefined") {
    return null;
  }

  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) {
      return null;
    }

    if (!url.pathname.startsWith("/")) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
};

export default function RegisterLoginPage() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string>("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const safeReferrer = getSafeInternalPath(document.referrer);
      const prev =
        safeReferrer && safeReferrer !== "/register" ? safeReferrer : "/";
      if (window.history.length > 1) {
        const lastUrl = getSafeInternalPath(sessionStorage.getItem("lastUrl"));
        if (lastUrl && lastUrl !== "/register") {
          setRedirectTo(lastUrl);
        } else {
          setRedirectTo(prev);
        }
      } else {
        setRedirectTo(prev);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("lastUrl", window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const apiUrl = API_URL;
      const endpoint = mode === "register" ? "/register" : "/login";
      const body =
        mode === "register"
          ? { name, username, email, password }
          : { email, password };
      const res = await fetch(`${apiUrl}/auth${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.errors || "Unknown error");
      } else {
        setSuccess(
          mode === "register"
            ? "Registration successful! Please follow the link in your email to verify your account."
            : "Login successful!"
        );
        if (mode === "login" && data.token) {
          localStorage.setItem("token", data.token);
          window.dispatchEvent(new Event("authChanged"));
          // Manually refresh the page after login
          setTimeout(() => {
            window.location.href = redirectTo || "/";
          }, 500);
        }
      }
    } catch (_err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography variant="headingMedium">{mode === "register" ? "Register" : "Login"}</Typography>
      <form onSubmit={handleSubmit}>
        {mode === "register" && (
          <>
            <div>
              <label htmlFor="reg-name">Name:</label>
              <Input
                id="reg-name"
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div>
              <label htmlFor="reg-username">Username:</label>
              <Input
                id="reg-username"
                type="text"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </>
        )}
        <div>
          <label htmlFor="reg-email">Email:</label>
          <Input
            id="reg-email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label htmlFor="reg-password">Password:</label>
          <Input
            id="reg-password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Submitting…" : mode === "register" ? "Register" : "Login"}
        </button>
      </form>
      {mode === "login" && (
        <div className={styles.forgotPasswordLink}>
          <Link href="/forgot-password">Forgot your password?</Link>
        </div>
      )}
      <button
        type="button"
        className={styles.toggleButton}
        onClick={() => {
          setMode(mode === "register" ? "login" : "register");
          setError(null);
          setSuccess(null);
        }}
      >
        {mode === "register"
          ? "Already have an account? Login"
          : "Need an account? Register"}
      </button>
      {error && (
        <div>{typeof error === "string" ? error : JSON.stringify(error)}</div>
      )}
      {success && (
        <div>
          {success}
          {mode === "register" && (
            <div className={styles.verificationNote}>
              If you don&apos;t receive your verification email, please contact{" "}
              <a href="mailto:hello@thepubdb.com">hello@thepubdb.com</a>{" "}
              for assistance.
            </div>
          )}
        </div>
      )}
    </>
  );
}
