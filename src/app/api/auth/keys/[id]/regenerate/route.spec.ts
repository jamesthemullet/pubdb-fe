import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("/api/auth/keys/[id]/regenerate", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.API_URL = "https://api.example.com";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("forwards POST to the backend with the auth header and encoded id", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ key: "new-key-value" })
    );

    const response = await POST(
      new Request("http://localhost/api/auth/keys/key_ab12cd34/regenerate", {
        method: "POST",
        headers: { cookie: "auth-token=user-token" },
        body: "",
      }),
      { params: Promise.resolve({ id: "key_ab12cd34" }) }
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/auth/keys/key_ab12cd34/regenerate",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer user-token",
          "Content-Type": "application/json",
        }),
      })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ key: "new-key-value" });
  });

  it("URL-encodes the key id before calling the backend", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({})
    );

    await POST(
      new Request("http://localhost/api/auth/keys/key+special/regenerate", {
        method: "POST",
        headers: { cookie: "auth-token=user-token" },
      }),
      { params: Promise.resolve({ id: "key+special" }) }
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/auth/keys/key%2Bspecial/regenerate",
      expect.any(Object)
    );
  });

  it("propagates the backend error status and body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "Unauthorized" }, 401)
    );

    const response = await POST(
      new Request("http://localhost/api/auth/keys/key_bogus/regenerate", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "key_bogus" }) }
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 500 with the error message when fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("Connection refused")
    );

    const response = await POST(
      new Request("http://localhost/api/auth/keys/key_x/regenerate", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "key_x" }) }
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Connection refused" });
  });

  it("returns 500 with 'Request failed' when fetch throws a non-Error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue("boom");

    const response = await POST(
      new Request("http://localhost/api/auth/keys/key_x/regenerate", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "key_x" }) }
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Request failed" });
  });
});
