import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/pubs/random", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.API_URL = "https://api.example.com";
    delete process.env.TESTING_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("proxies to the random pub endpoint, forwarding filter query params", async () => {
    const payload = { data: { id: "1", name: "The Harp" } };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const response = await GET(
      new Request("http://localhost/api/pubs/random?city=London&amenities[wifi]=true")
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/pubs/random?city=London&amenities[wifi]=true",
      { headers: {}, cache: "no-store" }
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(payload);
  });

  it("forwards the Authorization header from the auth cookie", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );

    await GET(
      new Request("http://localhost/api/pubs/random", {
        headers: { cookie: "auth-token=user-token" },
      })
    );

    const calledHeaders = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(calledHeaders.Authorization).toBe("Bearer user-token");
  });

  it("returns a 404 with the upstream error payload when no pub matches", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "No matching pub found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      })
    );

    const response = await GET(new Request("http://localhost/api/pubs/random?city=Nowhere"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "No matching pub found" });
  });

  it("returns 500 when the upstream fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network failure"));

    const response = await GET(new Request("http://localhost/api/pubs/random"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" });
  });
});
