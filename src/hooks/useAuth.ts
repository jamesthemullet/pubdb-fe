"use client";
import { useEffect, useState } from "react";

export type AuthUser = {
  email: string;
  approved?: boolean;
  admin?: boolean;
  name?: string;
  username?: string;
  image?: string;
  location?: string;
  bio?: string;
} | null;

type AuthPayload = {
  email: string;
  approved?: boolean;
  admin?: boolean;
  name?: string;
  username?: string;
  image?: string;
  location?: string;
  bio?: string;
};

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
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const raw: unknown = await res.json();
          if (isAuthPayload(raw)) {
            setUser({
              email: raw.email,
              approved: raw.approved,
              admin: raw.admin,
              name: raw.name,
              username: raw.username,
              image: raw.image,
              location: raw.location,
              bio: raw.bio,
            });
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
