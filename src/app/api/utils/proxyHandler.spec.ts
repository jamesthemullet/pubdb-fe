import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApiProxyHandler } from "./proxyHandler";

describe("createApiProxyHandler", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.TESTING_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 500 when TESTING_API_KEY is missing", async () => {
    const handler = createApiProxyHandler("/api/v1/resource");
    const response = await handler(new Request("http://localhost/api/resource"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Missing API key" });
  });

  it("fetches the configured endpoint with X-API-Key header", async () => {
    process.env.API_URL = "https://api.example.com";
    process.env.TESTING_API_KEY = "test-key";

    const payload = [{ id: 1, name: "Thing" }];
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const handler = createApiProxyHandler("/api/v1/things");
    const response = await handler(new Request("http://localhost/api/things"));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/things",
      { headers: { "X-API-Key": "test-key" }, cache: "no-store" }
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(payload);
  });

  it("forwards Authorization header when forwardAuth is true", async () => {
    process.env.TESTING_API_KEY = "test-key";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const handler = createApiProxyHandler("/api/v1/things", { forwardAuth: true });
    const request = new Request("http://localhost/api/things", {
      headers: { authorization: "Bearer user-token" },
    });

    await handler(request);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      {
        headers: { "X-API-Key": "test-key", Authorization: "Bearer user-token" },
        cache: "no-store",
      }
    );
  });

  it("does not forward Authorization header when forwardAuth is not set", async () => {
    process.env.TESTING_API_KEY = "test-key";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const handler = createApiProxyHandler("/api/v1/things");
    const request = new Request("http://localhost/api/things", {
      headers: { authorization: "Bearer user-token" },
    });

    await handler(request);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      { headers: { "X-API-Key": "test-key" }, cache: "no-store" }
    );
  });

  it("does not forward Authorization header when forwardAuth is false", async () => {
    process.env.TESTING_API_KEY = "test-key";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const handler = createApiProxyHandler("/api/v1/things", { forwardAuth: false });
    const request = new Request("http://localhost/api/things", {
      headers: { authorization: "Bearer user-token" },
    });

    await handler(request);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      { headers: { "X-API-Key": "test-key" }, cache: "no-store" }
    );
  });

  it("returns upstream error status and body for non-OK responses", async () => {
    process.env.TESTING_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      })
    );

    const handler = createApiProxyHandler("/api/v1/things", {
      resourceName: "things",
    });
    const response = await handler(new Request("http://localhost/api/things"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });

  it("uses resourceName in default error when upstream body is not JSON", async () => {
    process.env.TESTING_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not-json", { status: 502 })
    );

    const handler = createApiProxyHandler("/api/v1/things", {
      resourceName: "things",
    });
    const response = await handler(new Request("http://localhost/api/things"));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch things",
    });
  });

  it("returns 500 with the error message when fetch throws an Error", async () => {
    process.env.TESTING_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("Connection refused")
    );

    const handler = createApiProxyHandler("/api/v1/things");
    const response = await handler(new Request("http://localhost/api/things"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Connection refused",
    });
  });

  it("returns 500 with default error message when fetch throws a non-Error", async () => {
    process.env.TESTING_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockRejectedValue("boom");

    const handler = createApiProxyHandler("/api/v1/things", {
      resourceName: "things",
    });
    const response = await handler(new Request("http://localhost/api/things"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch things",
    });
  });

  it("falls back to localhost:4000 when no API URL env var is set", async () => {
    process.env.TESTING_API_KEY = "test-key";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const handler = createApiProxyHandler("/api/v1/things");
    await handler(new Request("http://localhost/api/things"));

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/things",
      expect.any(Object)
    );
  });

  it("uses NEXT_PUBLIC_API_URL when API_URL is not set", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://public-api.example.com";
    process.env.TESTING_API_KEY = "test-key";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const handler = createApiProxyHandler("/api/v1/things");
    await handler(new Request("http://localhost/api/things"));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://public-api.example.com/api/v1/things",
      expect.any(Object)
    );
  });
});
