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

  it("forwards query params (minus keyPrefix) to /api/v1/pubs", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ token: "pgt_abc123" }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: [] }));

    const request = new Request(
      "http://localhost/api/playground/pubs?keyPrefix=pk_dev_abc&page=2&limit=10",
      { headers: { authorization: "Bearer user-token" } }
    );

    const response = await GET(request);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.com/api/v1/pubs?page=2&limit=10",
      { headers: { "X-API-Key": "pgt_abc123" }, cache: "no-store" }
    );
    expect(response.status).toBe(200);
  });
});
