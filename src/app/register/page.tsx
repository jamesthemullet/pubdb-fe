"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string>("/");

  useEffect(() => {
    // Store previous page in sessionStorage when navigating to /register
    if (typeof window !== "undefined") {
      const prev =
        document.referrer && !document.referrer.includes("/register")
          ? document.referrer
          : "/";
      // If coming from another page in the app, use window.history
      if (window.history.length > 1) {
        const lastUrl = sessionStorage.getItem("lastUrl");
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
    // Track last visited page
    if (typeof window !== "undefined") {
      sessionStorage.setItem("lastUrl", window.location.pathname);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const endpoint = mode === "register" ? "/register" : "/login";
      const body =
        mode === "register" ? { name, email, password } : { email, password };
      const res = await fetch(`${apiUrl}${endpoint}`, {
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
            ? "Registration successful! You can now log in."
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
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>{mode === "register" ? "Register" : "Login"}</h2>
      <form onSubmit={handleSubmit}>
        {mode === "register" && (
          <div>
            <label>
              Name:
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          </div>
        )}
        <div>
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Submitting…" : mode === "register" ? "Register" : "Login"}
        </button>
      </form>
      <button
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
      {success && <div>{success}</div>}
    </div>
  );
}
