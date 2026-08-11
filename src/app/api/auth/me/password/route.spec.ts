import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("PATCH /api/auth/me/password", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.API_URL = "https://api.example.com";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("forwards the Authorization header and body to the upstream password endpoint", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ message: "Password updated" }));

    const request = new Request("http://localhost/api/auth/me/password", {
      method: "PATCH",
      headers: { authorization: "Bearer user-token", "content-type": "application/json" },
      body: JSON.stringify({ currentPassword: "old", newPassword: "new" }),
    });

    const response = await PATCH(request);

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/auth/me/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer user-token" },
      body: JSON.stringify({ currentPassword: "old", newPassword: "new" }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ message: "Password updated" });
  });

  it("omits Authorization when no token is provided", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ error: "Unauthorized" }, 401));

    const request = new Request("http://localhost/api/auth/me/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword: "old", newPassword: "new" }),
    });

    const response = await PATCH(request);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/auth/me/password",
      expect.objectContaining({ headers: { "Content-Type": "application/json" } }),
    );
    expect(response.status).toBe(401);
  });

  it("propagates the upstream error status when the current password is wrong", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "Wrong password" }, 400),
    );

    const request = new Request("http://localhost/api/auth/me/password", {
      method: "PATCH",
      headers: { authorization: "Bearer user-token" },
      body: JSON.stringify({ currentPassword: "wrong", newPassword: "new" }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Wrong password" });
  });

  it("returns 500 with the error message when the upstream fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network failure"));

    const request = new Request("http://localhost/api/auth/me/password", {
      method: "PATCH",
      headers: { authorization: "Bearer user-token" },
      body: "{}",
    });

    const response = await PATCH(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Network failure" });
  });
});
