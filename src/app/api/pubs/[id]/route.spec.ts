import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PATCH } from "./route";

const originalEnv = process.env;

function setupEnv() {
  vi.restoreAllMocks();
  process.env = { ...originalEnv, API_URL: "https://api.example.com", TESTING_API_KEY: "test-key" };
}

function teardownEnv() {
  process.env = originalEnv;
}

function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/pubs/[id]", () => {
  beforeEach(setupEnv);
  afterEach(teardownEnv);

  it("proxies to the upstream API for the given pub id", async () => {
    const pub = { id: "abc", name: "The Harp" };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(pub));

    const response = await GET(new Request("http://localhost/api/pubs/abc"), mockParams("abc"));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/pubs/abc",
      expect.objectContaining({ headers: expect.objectContaining({ "X-API-Key": "test-key" }) })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(pub);
  });
});

describe("PATCH /api/pubs/[id]", () => {
  beforeEach(setupEnv);
  afterEach(teardownEnv);

  it("forwards the body and auth header upstream and returns the result", async () => {
    const updated = { id: "abc", name: "Updated Pub" };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(updated));

    const req = new Request("http://localhost/api/pubs/abc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", authorization: "Bearer user-token" },
      body: JSON.stringify({ name: "Updated Pub" }),
    });

    const response = await PATCH(req, mockParams("abc"));

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/pubs/abc",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer user-token",
          "X-API-Key": "test-key",
        }),
      })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(updated);
  });

  it("returns 500 when the upstream fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Upstream unavailable"));

    const req = new Request("http://localhost/api/pubs/abc", { method: "PATCH", body: "{}" });
    const response = await PATCH(req, mockParams("abc"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: "Upstream unavailable" });
  });
});

describe("DELETE /api/pubs/[id]", () => {
  beforeEach(setupEnv);
  afterEach(teardownEnv);

  it("returns 204 with no body when upstream returns 204", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    const response = await DELETE(
      new Request("http://localhost/api/pubs/abc", { method: "DELETE" }),
      mockParams("abc")
    );

    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
  });

  it("returns the JSON body when upstream returns content", async () => {
    const body = { deleted: true };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(body));

    const response = await DELETE(
      new Request("http://localhost/api/pubs/abc", { method: "DELETE" }),
      mockParams("abc")
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(body);
  });

  it("returns 500 when the upstream fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Connection refused"));

    const response = await DELETE(
      new Request("http://localhost/api/pubs/abc", { method: "DELETE" }),
      mockParams("abc")
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: "Connection refused" });
  });
});
