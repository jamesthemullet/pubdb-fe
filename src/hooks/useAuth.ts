"use client";

// Re-export AuthUser so existing `import type { AuthUser } from "@/hooks/useAuth"` keeps working.
export type { AuthUser } from "@/contexts/AuthContext";

// useAuthContext is the single source of auth state across the app.
// Every call to useAuth() reads from the shared AuthProvider at the root layout
// instead of making its own /api/auth/me request.
import { useAuthContext } from "@/contexts/AuthContext";

export function useAuth(): ReturnType<typeof useAuthContext> {
  return useAuthContext();
}
