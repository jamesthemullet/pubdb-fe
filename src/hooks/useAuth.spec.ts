import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "./useAuth";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("useAuth", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null user and false flags when /auth/me reports no session", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}, 401));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.user).toBeNull());
    expect(result.current.isApproved).toBe(false);
    expect(result.current.isAdmin).toBe(false);
  });

  it("sets user from /auth/me when the API returns a valid payload", async () => {
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
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.user).toBeNull());
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isApproved).toBe(false);
  });

  it("re-checks auth when an authChanged event is dispatched", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(jsonResponse({ email: "bob@example.com" }));

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.user).toBeNull());

    window.dispatchEvent(new Event("authChanged"));

    await waitFor(() => expect(result.current.user?.email).toBe("bob@example.com"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
