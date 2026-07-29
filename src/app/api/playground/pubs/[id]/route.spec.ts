import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/playground/pubs/[id]", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    process.env.API_URL = "https://api.example.com";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("substitutes the id into /api/v1/pubs/:id", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ token: "pgt_abc123" }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { id: "pub_1" } }));

    const request = new Request(
      "http://localhost/api/playground/pubs/pub_1?id=key_dev_abc",
      { headers: { authorization: "Bearer user-token" } }
    );

    const response = await GET(request, { params: Promise.resolve({ id: "pub_1" }) });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.com/api/v1/pubs/pub_1",
      { headers: { "X-API-Key": "pgt_abc123" }, cache: "no-store" }
    );
    expect(response.status).toBe(200);
  });
});
