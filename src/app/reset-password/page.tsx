"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import StandardLayout from "../StandardLayout";

export default function ResetPasswordPage() {
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

  async function handleSubmit(e: React.FormEvent) {
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/reset-password`, {
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
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <StandardLayout>
        <div style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem" }}>
          <h2>Invalid Reset Link</h2>
          <p>This password reset link is invalid or has expired.</p>
          <div style={{ marginTop: "2rem" }}>
            <a href="/forgot-password" style={{ color: "#007bff" }}>
              Request a new password reset
            </a>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem" }}>
        <h2>Reset Password</h2>
        <p>Enter your new password below.</p>

        <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
          <label style={{ display: "block", marginBottom: "1rem" }}>
            New Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                display: "block",
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "1rem" }}>
            Confirm Password:
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              style={{
                display: "block",
                width: "100%",
                padding: "0.5rem",
                marginTop: "0.25rem",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: loading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {message && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "#d4edda",
              color: "#155724",
              borderRadius: "4px",
            }}
          >
            {message}
            <div style={{ marginTop: "1rem" }}>
              <a
                href="/register"
                style={{ color: "#155724", textDecoration: "underline" }}
              >
                Go to Login
              </a>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "#f8d7da",
              color: "#721c24",
              borderRadius: "4px",
            }}
          >
            {typeof error === "string" ? error : JSON.stringify(error)}
          </div>
        )}

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <a href="/register" style={{ color: "#007bff" }}>
            Back to Login
          </a>
        </div>
      </div>
    </StandardLayout>
  );
}
