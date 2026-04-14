import { describe, expect, it } from "vitest";

import { buildAuthHeaders } from "./auth";

describe("buildAuthHeaders", () => {
  it("returns a Bearer Authorization header when token is a non-empty string", () => {
    expect(buildAuthHeaders("abc123")).toEqual({
      Authorization: "Bearer abc123",
    });
  });

  it("returns empty object when token is null", () => {
    expect(buildAuthHeaders(null)).toEqual({});
  });

  it("returns empty object when token is undefined", () => {
    expect(buildAuthHeaders(undefined)).toEqual({});
  });

  it("returns empty object when token is an empty string", () => {
    expect(buildAuthHeaders("")).toEqual({});
  });

  it("preserves the full token value in the header", () => {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature";
    expect(buildAuthHeaders(token)).toEqual({
      Authorization: `Bearer ${token}`,
    });
  });
});
