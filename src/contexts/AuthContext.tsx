"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

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
  // Optional so existing mocks of useAuth()/useAuthContext() in other specs
  // (which predate this field) still satisfy the type without edits.
  isLoading?: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isApproved: false,
  isAdmin: false,
  isLoading: false,
});

function isAuthPayload(value: unknown): value is NonNullable<AuthUser> {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.email === "string";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth(): Promise<void> {
      try {
        const res = await fetch("/api/auth/me");
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
        setUser(null);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
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

  return (
    <AuthContext.Provider
      value={{ user, isApproved: !!user?.approved, isAdmin: !!user?.admin, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}
