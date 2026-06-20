import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/beer-types", () => {
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


  it("fetches beer types with X-API-Key header", async () => {
    process.env.API_URL = "https://api.example.com";
    process.env.TESTING_API_KEY = "test-key";

    const request = new Request("http://localhost/api/beer-types");
    const payload = [{ id: 1, name: "IPA" }];
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const response = await GET(request);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/beer-types",
      {
        headers: { "X-API-Key": "test-key" },
        cache: "no-store",
      }
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(payload);
  });

  it("forwards Authorization header when present", async () => {
    process.env.TESTING_API_KEY = "test-key";

    const request = new Request("http://localhost/api/beer-types", {
      headers: { authorization: "Bearer token-123" },
    });

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    await GET(request);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/beer-types",
      {
        headers: {
          "X-API-Key": "test-key",
          Authorization: "Bearer token-123",
        },
        cache: "no-store",
      }
    );
  });

  it("falls back to NEXT_PUBLIC_API_URL when API_URL is not set", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://public-api.example.com";
    process.env.TESTING_API_KEY = "public-key";

    const request = new Request("http://localhost/api/beer-types");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    await GET(request);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://public-api.example.com/api/v1/beer-types",
      {
        headers: { "X-API-Key": "public-key" },
        cache: "no-store",
      }
    );
  });

  it("returns upstream error payload and status for non-OK responses", async () => {
    process.env.TESTING_API_KEY = "test-key";

    const request = new Request("http://localhost/api/beer-types");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    );

    const response = await GET(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("uses default error payload when upstream error body is not JSON", async () => {
    process.env.TESTING_API_KEY = "test-key";

    const request = new Request("http://localhost/api/beer-types");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not-json", {
        status: 502,
      })
    );

    const response = await GET(request);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch beer types",
    });
  });

  it("returns 500 with thrown error message when fetch throws", async () => {
    process.env.TESTING_API_KEY = "test-key";

    const request = new Request("http://localhost/api/beer-types");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network down"));

    const response = await GET(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Network down" });
  });

  it("returns default error message when fetch throws a non-Error", async () => {
    process.env.TESTING_API_KEY = "test-key";

    const request = new Request("http://localhost/api/beer-types");
    vi.spyOn(globalThis, "fetch").mockRejectedValue("boom");

    const response = await GET(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch beer types",
    });
  });
});
