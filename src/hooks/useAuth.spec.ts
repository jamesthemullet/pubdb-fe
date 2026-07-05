import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "./useAuth";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeJwt(payload: Record<string, unknown>): string {
  const encoded = btoa(JSON.stringify(payload));
  return `header.${encoded}.sig`;
}

describe("useAuth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null user and false flags when no token is in localStorage", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.user).toBeNull());
    expect(result.current.isApproved).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it("sets user from /auth/me when the API returns a valid payload", async () => {
    localStorage.setItem("token", "a-valid-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ email: "alice@example.com", approved: true, admin: false })
    );
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.user).not.toBeNull());
    expect(result.current.user?.email).toBe("alice@example.com");
    expect(result.current.isApproved).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it("returns null user when /auth/me throws a network error", async () => {
    const token = makeJwt({ email: "bob@example.com", approved: false, admin: true });
    localStorage.setItem("token", token);
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.user).toBeNull());
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isApproved).toBe(false);
  });
});
