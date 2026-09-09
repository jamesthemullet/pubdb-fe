import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

describe("GET /api/pubs", () => {
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


  it("fetches pubs and returns response data on success", async () => {
    process.env.API_URL = "https://api.example.com";
    process.env.TESTING_API_KEY = "test-key";

    const payload = [{ id: 1, name: "The Harp" }];
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const response = await GET(new Request("http://localhost/api/pubs"));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/pubs",
      { headers: {}, cache: "no-store" }
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(payload);
  });

  it("falls back to NEXT_PUBLIC_API_URL when API_URL is not set", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://public-api.example.com";
    process.env.TESTING_API_KEY = "public-key";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    await GET(new Request("http://localhost/api/pubs"));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://public-api.example.com/pubs",
      { headers: {}, cache: "no-store" }
    );
  });

  it("returns upstream error payload and status for non-OK responses", async () => {
    process.env.TESTING_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Bad Request" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      })
    );

    const response = await GET(new Request("http://localhost/api/pubs"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Bad Request" });
  });

  it("uses default error payload when upstream error body is not JSON", async () => {
    process.env.TESTING_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not-json", {
        status: 502,
      })
    );

    const response = await GET(new Request("http://localhost/api/pubs"));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch pubs",
    });
  });

  it("returns 500 with a generic message when fetch throws", async () => {
    process.env.TESTING_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network down"));

    const response = await GET(new Request("http://localhost/api/pubs"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" });
  });

  it("returns 500 with a generic message when fetch throws a non-Error", async () => {
    process.env.TESTING_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockRejectedValue("boom");

    const response = await GET(new Request("http://localhost/api/pubs"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Internal server error",
    });
  });

  it("falls back to localhost when API_URL and NEXT_PUBLIC_API_URL are missing", async () => {
    process.env.TESTING_API_KEY = "test-key";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    await GET(new Request("http://localhost/api/pubs"));

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/pubs",
      { headers: {}, cache: "no-store" }
    );
  });
});

describe("POST /api/pubs", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.API_URL = "https://api.example.com";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("forwards the request body and auth header to the upstream API and returns the result", async () => {
    const upstreamData = { id: "1", name: "The Harp" };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(upstreamData), {
        status: 201,
        headers: { "content-type": "application/json" },
      })
    );

    const request = new Request("http://localhost/api/pubs", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: "auth-token=user-token" },
      body: JSON.stringify({ name: "The Harp" }),
    });

    const response = await POST(request);

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/pubs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer user-token",
      },
      body: JSON.stringify({ name: "The Harp" }),
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(upstreamData);
  });

  it("omits the Authorization header when there is no auth cookie", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 201 })
    );

    const request = new Request("http://localhost/api/pubs", {
      method: "POST",
      body: JSON.stringify({ name: "The Harp" }),
    });

    await POST(request);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/pubs",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("returns the upstream error payload and status for non-OK responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      })
    );

    const request = new Request("http://localhost/api/pubs", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Name is required" });
  });

  it("returns null data when the upstream response body is not JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("not-json", { status: 502 }));

    const request = new Request("http://localhost/api/pubs", {
      method: "POST",
      body: JSON.stringify({ name: "The Harp" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toBeNull();
  });

  it("returns 500 with the error message when fetch throws an Error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network down"));

    const request = new Request("http://localhost/api/pubs", {
      method: "POST",
      body: JSON.stringify({ name: "The Harp" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Network down" });
  });

  it("returns 500 with a generic message when fetch throws a non-Error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue("boom");

    const request = new Request("http://localhost/api/pubs", {
      method: "POST",
      body: JSON.stringify({ name: "The Harp" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Failed to create pub" });
  });
});

