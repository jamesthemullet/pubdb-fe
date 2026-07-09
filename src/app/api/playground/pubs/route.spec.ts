import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/playground/pubs", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.API_URL = "https://api.example.com";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 401 when no Authorization header is present", async () => {
    const request = new Request("http://localhost/api/playground/pubs?keyPrefix=pk_dev_abc");

    const response = await GET(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Missing token" });
  });

  it("returns 400 when keyPrefix is missing", async () => {
    const request = new Request("http://localhost/api/playground/pubs", {
      headers: { authorization: "Bearer user-token" },
    });

    const response = await GET(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "keyPrefix is required" });
  });

  it("mints a playground token then calls /api/v1/pubs with it as X-API-Key", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ token: "pgt_abc123", tier: "DEVELOPER", expiresIn: 300 }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: [{ id: "pub_1" }] }));

    const request = new Request(
      "http://localhost/api/playground/pubs?keyPrefix=pk_dev_abc&hasCaskAle=true",
      { headers: { authorization: "Bearer user-token" } }
    );

    const response = await GET(request);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.com/auth/keys/pk_dev_abc/playground-token",
      { method: "POST", headers: { Authorization: "Bearer user-token" } }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.com/api/v1/pubs?hasCaskAle=true",
      { headers: { "X-API-Key": "pgt_abc123" }, cache: "no-store" }
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data: [{ id: "pub_1" }] });
  });

  it("passes through the upstream error when minting the token fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({ error: "API key not found" }, 404)
    );

    const request = new Request("http://localhost/api/playground/pubs?keyPrefix=pk_missing", {
      headers: { authorization: "Bearer user-token" },
    });

    const response = await GET(request);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "API key not found" });
  });

  it("returns 500 when a network error occurs", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Connection refused"));

    const request = new Request("http://localhost/api/playground/pubs?keyPrefix=pk_dev_abc", {
      headers: { authorization: "Bearer user-token" },
    });

    const response = await GET(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" });
  });
});
