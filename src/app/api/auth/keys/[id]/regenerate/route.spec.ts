import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/auth/keys/[id]/regenerate", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.API_URL = "https://api.example.com";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("forwards POST to the backend with the Authorization header and the key id", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ key: "new-key-value" }));

    const response = await POST(
      new Request("http://localhost/api/auth/keys/key_abc123/regenerate", {
        method: "POST",
        headers: { authorization: "Bearer user-token" },
      }),
      { params: Promise.resolve({ id: "key_abc123" }) },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/auth/keys/key_abc123/regenerate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer user-token" },
        body: "",
      },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ key: "new-key-value" });
  });

  it("URL-encodes special characters in the key id", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

    await POST(
      new Request("http://localhost/api/auth/keys/key%2Fspecial/regenerate", {
        method: "POST",
        headers: { authorization: "Bearer token" },
      }),
      { params: Promise.resolve({ id: "key/special" }) },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/auth/keys/key%2Fspecial/regenerate",
      expect.anything(),
    );
  });

  it("propagates the backend error status when the key is not found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "Not found" }, 404),
    );

    const response = await POST(
      new Request("http://localhost/api/auth/keys/key_bogus/regenerate", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "key_bogus" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });

  it("returns 500 with the error message when the upstream fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Connection refused"));

    const response = await POST(
      new Request("http://localhost/api/auth/keys/key_abc/regenerate", {
        method: "POST",
        headers: { authorization: "Bearer token" },
      }),
      { params: Promise.resolve({ id: "key_abc" }) },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Connection refused" });
  });
});
