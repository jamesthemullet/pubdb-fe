import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  it("clears the auth-token cookie", async () => {
    const response = await POST();

    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("auth-token=;");
    expect(setCookie.toLowerCase()).toContain("max-age=0");
    await expect(response.json()).resolves.toEqual({ success: true });
  });
});
