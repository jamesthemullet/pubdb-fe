"use client";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/apiConfig";

export type AuthUser = {
  email: string;
  approved?: boolean;
  admin?: boolean;
} | null;

type AuthPayload = { email: string; approved?: boolean; admin?: boolean };

function isAuthPayload(value: unknown): value is AuthPayload {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.email === "string";
}

export function useAuth(): { user: AuthUser; isApproved: boolean; isAdmin: boolean } {
  const [user, setUser] = useState<AuthUser>(null);

  useEffect(() => {
    async function checkAuth(): Promise<void> {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const raw: unknown = await res.json();
          if (isAuthPayload(raw)) {
            setUser({ email: raw.email, approved: raw.approved, admin: raw.admin });
            return;
          }
        }
      } catch { /* network error */ }
      setUser(null);
    }
    void checkAuth();
    window.addEventListener("authChanged", checkAuth);
    window.addEventListener("storage", checkAuth);
    return () => {
      window.removeEventListener("authChanged", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  return { user, isApproved: !!user?.approved, isAdmin: !!user?.admin };
}
