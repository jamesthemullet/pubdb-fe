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
  usageLimitAlertsEnabled?: boolean;
  pubEditAlertsEnabled?: boolean;
} | null;

type AuthPayload = NonNullable<AuthUser>;

function isAuthPayload(value: unknown): value is AuthPayload {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.email === "string";
}

// Module-level cache: avoids redundant /api/auth/me requests when multiple
// components that use useAuth mount on the same page (e.g. Sidebar + page component).
// undefined = not yet fetched; null = fetched, not authenticated.
let authCache: AuthUser | undefined ;

/** Reset the in-memory auth cache. Exposed for testing only. */
export function clearAuthCache(): void {
  authCache = undefined;
}

export function useAuth(): { user: AuthUser; isApproved: boolean; isAdmin: boolean } {
  const [user, setUser] = useState<AuthUser>(authCache !== undefined ? authCache : null);

  useEffect(() => {
    async function checkAuth(): Promise<void> {
      if (authCache !== undefined) {
        setUser(authCache);
        return;
      }
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const raw: unknown = await res.json();
          if (isAuthPayload(raw)) {
            const authUser: NonNullable<AuthUser> = {
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
            };
            authCache = authUser;
            setUser(authUser);
            return;
          }
        }
      } catch { /* network error */ }
      authCache = null;
      setUser(null);
    }

    void checkAuth();

    function handleAuthChange(): void {
      authCache = undefined; // invalidate cache so next checkAuth re-fetches
      void checkAuth();
    }

    window.addEventListener("authChanged", handleAuthChange);
    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
    };
  }, []);

  return { user, isApproved: !!user?.approved, isAdmin: !!user?.admin };
}
