import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "./route";

describe("PATCH /api/pubs/[id]", () => {
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

  it("proxies the request body and auth header to the upstream API and returns the response", async () => {
    process.env.API_URL = "https://api.example.com";
    process.env.TESTING_API_KEY = "test-key";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "42", name: "The Crown" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const request = new Request("http://localhost/api/pubs/42", {
      method: "PATCH",
      body: JSON.stringify({ name: "The Crown" }),
      headers: { Authorization: "Bearer user-token" },
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "42" }) });

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/pubs/42", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "test-key",
        Authorization: "Bearer user-token",
      },
      body: JSON.stringify({ name: "The Crown" }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: "42", name: "The Crown" });
  });

  it("returns 500 with the error message when the upstream fetch throws", async () => {
    process.env.API_URL = "https://api.example.com";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Connection refused"));

    const request = new Request("http://localhost/api/pubs/1", { method: "PATCH", body: "{}" });
    const response = await PATCH(request, { params: Promise.resolve({ id: "1" }) });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Connection refused" });
  });
});

describe("DELETE /api/pubs/[id]", () => {
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

  it("returns an empty 204 response when the upstream responds with 204 No Content", async () => {
    process.env.API_URL = "https://api.example.com";
    process.env.TESTING_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 })
    );

    const request = new Request("http://localhost/api/pubs/7", {
      method: "DELETE",
      headers: { Authorization: "Bearer user-token" },
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: "7" }) });

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
  });

  it("returns 500 with the error message when the upstream fetch throws", async () => {
    process.env.API_URL = "https://api.example.com";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Timeout"));

    const request = new Request("http://localhost/api/pubs/5", { method: "DELETE" });
    const response = await DELETE(request, { params: Promise.resolve({ id: "5" }) });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Timeout" });
  });
});
