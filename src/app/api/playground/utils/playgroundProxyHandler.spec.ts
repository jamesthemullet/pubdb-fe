import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPlaygroundProxyHandler } from "./playgroundProxyHandler";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("createPlaygroundProxyHandler", () => {
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
    const handler = createPlaygroundProxyHandler(() => "/api/v1/things");
    const request = new Request("http://localhost/api/playground/things?keyPrefix=pk_dev_abc");

    const response = await handler(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Missing token" });
  });

  it("returns 400 when keyPrefix is missing", async () => {
    const handler = createPlaygroundProxyHandler(() => "/api/v1/things");
    const request = new Request("http://localhost/api/playground/things", {
      headers: { authorization: "Bearer user-token" },
    });

    const response = await handler(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "keyPrefix is required" });
  });

  it("mints a playground token then calls the built endpoint path with it as X-API-Key", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ token: "pgt_abc123", tier: "DEVELOPER", expiresIn: 300 }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: [{ id: "pub_1" }] }));

    const handler = createPlaygroundProxyHandler((params) => `/api/v1/things?${params.toString()}`);
    const request = new Request(
      "http://localhost/api/playground/things?keyPrefix=pk_dev_abc&hasCaskAle=true",
      { headers: { authorization: "Bearer user-token" } }
    );

    const response = await handler(request);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.com/auth/keys/pk_dev_abc/playground-token",
      { method: "POST", headers: { Authorization: "Bearer user-token" } }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.com/api/v1/things?hasCaskAle=true",
      { headers: { "X-API-Key": "pgt_abc123" }, cache: "no-store" }
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data: [{ id: "pub_1" }] });
  });

  it("forwards rate-limit headers from the upstream response", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ token: "pgt_abc123" }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-ratelimit-remaining": "42",
            "x-ratelimit-limit": "100",
            "x-ratelimit-reset": "1700000000",
          },
        })
      );

    const handler = createPlaygroundProxyHandler(() => "/api/v1/things");
    const request = new Request("http://localhost/api/playground/things?keyPrefix=pk_dev_abc", {
      headers: { authorization: "Bearer user-token" },
    });

    const response = await handler(request);

    expect(response.headers.get("x-ratelimit-remaining")).toBe("42");
    expect(response.headers.get("x-ratelimit-limit")).toBe("100");
    expect(response.headers.get("x-ratelimit-reset")).toBe("1700000000");
  });

  it("passes through the upstream error when minting the token fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({ error: "API key not found" }, 404)
    );

    const handler = createPlaygroundProxyHandler(() => "/api/v1/things");
    const request = new Request("http://localhost/api/playground/things?keyPrefix=pk_missing", {
      headers: { authorization: "Bearer user-token" },
    });

    const response = await handler(request);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "API key not found" });
  });

  it("returns 500 when a network error occurs", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Connection refused"));

    const handler = createPlaygroundProxyHandler(() => "/api/v1/things");
    const request = new Request("http://localhost/api/playground/things?keyPrefix=pk_dev_abc", {
      headers: { authorization: "Bearer user-token" },
    });

    const response = await handler(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" });
  });
});
