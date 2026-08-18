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

  it("forwards POST to the backend with auth header and encoded id", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ apiKey: "new-key-abc" })
    );

    const response = await POST(
      new Request("http://localhost/api/auth/keys/key_abc123/regenerate", {
        method: "POST",
        headers: { authorization: "Bearer user-token" },
      }),
      { params: Promise.resolve({ id: "key_abc123" }) }
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/auth/keys/key_abc123/regenerate",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer user-token" }),
      })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ apiKey: "new-key-abc" });
  });

  it("returns 500 with error message on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const response = await POST(
      new Request("http://localhost/api/auth/keys/key_abc123/regenerate", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "key_abc123" }) }
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Network error" });
  });
});
