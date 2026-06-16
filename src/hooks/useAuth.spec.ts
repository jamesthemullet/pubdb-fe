import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "./useAuth";

function makeJwt(payload: object): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("useAuth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns null user with no approvals when there is no token in localStorage", async () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAuth());
    // Allow the effect to run
    await act(async () => {});
    expect(result.current.user).toBeNull();
    expect(result.current.isApproved).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it("sets user from a successful API /auth/me response", async () => {
    localStorage.setItem("token", "some-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ email: "alice@example.com", approved: true, admin: false })
    );
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.user).not.toBeNull());
    expect(result.current.user?.email).toBe("alice@example.com");
    expect(result.current.isApproved).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it("falls back to JWT decode when the API returns a non-OK status", async () => {
    const payload = { email: "bob@example.com", approved: false, admin: true };
    localStorage.setItem("token", makeJwt(payload));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 401));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.user).not.toBeNull());
    expect(result.current.user?.email).toBe("bob@example.com");
    expect(result.current.isAdmin).toBe(true);
  });

  it("falls back to JWT decode when the API fetch throws a network error", async () => {
    const payload = { email: "carol@example.com", approved: true };
    localStorage.setItem("token", makeJwt(payload));
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.user?.email).toBe("carol@example.com"));
    expect(result.current.isApproved).toBe(true);
  });

  it("sets user to null when the JWT payload does not contain an email field", async () => {
    // Start with a valid JWT so user becomes non-null, then swap to invalid
    const validPayload = { email: "dave@example.com", approved: true };
    localStorage.setItem("token", makeJwt(validPayload));
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.user?.email).toBe("dave@example.com"));

    // Swap in a JWT whose payload has no email field
    localStorage.setItem("token", makeJwt({ sub: "no-email-here" }));
    await act(async () => {
      window.dispatchEvent(new Event("authChanged"));
    });

    await waitFor(() => expect(result.current.user).toBeNull());
  });
});
