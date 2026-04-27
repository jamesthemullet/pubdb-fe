"use client";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/apiConfig";

export type AuthUser = {
  email: string;
  approved?: boolean;
  admin?: boolean;
} | null;

type AuthPayload = { email: string; approved?: boolean; admin?: boolean };

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
          const data = await res.json() as AuthPayload;
          setUser({ email: data.email, approved: data.approved, admin: data.admin });
          return;
        }
      } catch { /* fall through to JWT decode */ }
      try {
        const payload = JSON.parse(atob(token.split(".")[1])) as AuthPayload;
        setUser({ email: payload.email, approved: payload.approved, admin: payload.admin });
      } catch {
        setUser(null);
      }
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
