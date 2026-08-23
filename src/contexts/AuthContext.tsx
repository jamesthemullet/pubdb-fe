"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type AuthUser = {
  email: string;
  approved?: boolean;
  admin?: boolean;
  name?: string;
  username?: string;
  image?: string;
  location?: string;
  bio?: string;
  usageLimitAlertsEnabled?: boolean;
  pubEditAlertsEnabled?: boolean;
} | null;

type AuthContextValue = {
  user: AuthUser;
  isApproved: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isApproved: false,
  isAdmin: false,
});

function isAuthPayload(value: unknown): value is NonNullable<AuthUser> {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.email === "string";
}

export function AuthProvider({ children }: { children: ReactNode }) {
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
              usageLimitAlertsEnabled: raw.usageLimitAlertsEnabled,
              pubEditAlertsEnabled: raw.pubEditAlertsEnabled,
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

  return (
    <AuthContext.Provider value={{ user, isApproved: !!user?.approved, isAdmin: !!user?.admin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}
