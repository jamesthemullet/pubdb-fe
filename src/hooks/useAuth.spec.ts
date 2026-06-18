import { act, renderHook, waitFor } from "@testing-library/react";
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
	return `header.${encoded}.signature`;
}

describe("useAuth", () => {
	beforeEach(() => {
		localStorage.clear();
		process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000";
	});

	afterEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
	});

	it("returns null user when no token is in localStorage", async () => {
		const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

		const { result } = renderHook(() => useAuth());

		await waitFor(() => {
			expect(result.current.user).toBeNull();
		});
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it("sets user from /auth/me when API responds with valid payload", async () => {
		localStorage.setItem("token", "some-token");
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ email: "alice@example.com", approved: true, admin: false }),
		);

		const { result } = renderHook(() => useAuth());

		await waitFor(() => {
			expect(result.current.user).toEqual({
				email: "alice@example.com",
				approved: true,
				admin: false,
			});
		});
		expect(result.current.isApproved).toBe(true);
		expect(result.current.isAdmin).toBe(false);
	});

	it("falls back to JWT decode when /auth/me returns non-ok status", async () => {
		const payload = { email: "bob@example.com", approved: true, admin: true };
		localStorage.setItem("token", makeJwt(payload));
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: "Unauthorized" }, 401));

		const { result } = renderHook(() => useAuth());

		await waitFor(() => {
			expect(result.current.user?.email).toBe("bob@example.com");
		});
		expect(result.current.isAdmin).toBe(true);
	});

	it("falls back to JWT decode when /auth/me throws a network error", async () => {
		const payload = { email: "carol@example.com", approved: false, admin: false };
		localStorage.setItem("token", makeJwt(payload));
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network failure"));

		const { result } = renderHook(() => useAuth());

		await waitFor(() => {
			expect(result.current.user?.email).toBe("carol@example.com");
		});
		expect(result.current.isApproved).toBe(false);
	});

	it("sets user to null when JWT payload lacks an email field", async () => {
		localStorage.setItem("token", makeJwt({ role: "admin" }));
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fail"));

		const { result } = renderHook(() => useAuth());

		await waitFor(() => {
			// hook finishes its async check
			expect(vi.mocked(globalThis.fetch)).toHaveBeenCalled();
		});
		expect(result.current.user).toBeNull();
	});

	it("sets user to null when the token is not a valid JWT", async () => {
		localStorage.setItem("token", "not-a-jwt");
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fail"));

		const { result } = renderHook(() => useAuth());

		await waitFor(() => {
			expect(vi.mocked(globalThis.fetch)).toHaveBeenCalled();
		});
		expect(result.current.user).toBeNull();
	});

	it("re-checks auth when authChanged event fires", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

		const { result } = renderHook(() => useAuth());

		await waitFor(() => {
			expect(result.current.user).toBeNull();
		});

		localStorage.setItem("token", "some-token");
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			jsonResponse({ email: "dave@example.com", approved: true, admin: false }),
		);

		act(() => {
			window.dispatchEvent(new Event("authChanged"));
		});

		await waitFor(() => {
			expect(result.current.user?.email).toBe("dave@example.com");
		});
	});
});
