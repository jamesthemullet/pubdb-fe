import { NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildHeaders, clearAuthCookie, getAuthHeader, setAuthCookie } from "./authCookie";

describe("getAuthHeader", () => {
  it("returns an Authorization header when the auth-token cookie is present", () => {
    const request = new Request("http://localhost/", {
      headers: { cookie: "auth-token=my-secret-token" },
    });
    expect(getAuthHeader(request)).toEqual({
      Authorization: "Bearer my-secret-token",
    });
  });

  it("returns an empty object when no cookie header is present", () => {
    const request = new Request("http://localhost/");
    expect(getAuthHeader(request)).toEqual({});
  });

  it("returns an empty object when the auth-token cookie is absent among other cookies", () => {
    const request = new Request("http://localhost/", {
      headers: { cookie: "session=abc; other=xyz" },
    });
    expect(getAuthHeader(request)).toEqual({});
  });

  it("decodes a URI-encoded token value", () => {
    const encoded = encodeURIComponent("tok/en+val=ue");
    const request = new Request("http://localhost/", {
      headers: { cookie: `auth-token=${encoded}` },
    });
    const header = getAuthHeader(request);
    expect(header).toEqual({ Authorization: "Bearer tok/en+val=ue" });
  });

  it("handles whitespace between cookies correctly", () => {
    const request = new Request("http://localhost/", {
      headers: { cookie: "  other=val ; auth-token=trimmed  ; another=x" },
    });
    expect(getAuthHeader(request)).toEqual({ Authorization: "Bearer trimmed" });
  });
});

describe("buildHeaders", () => {
  it("includes Content-Type when includeContentType is true", () => {
    const request = new Request("http://localhost/");
    expect(buildHeaders(request, true)).toEqual({
      "Content-Type": "application/json",
    });
  });

  it("omits Content-Type when includeContentType is false", () => {
    const request = new Request("http://localhost/");
    expect(buildHeaders(request, false)).toEqual({});
  });

  it("merges in the Authorization header from the auth-token cookie", () => {
    const request = new Request("http://localhost/", {
      headers: { cookie: "auth-token=my-secret-token" },
    });
    expect(buildHeaders(request, true)).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer my-secret-token",
    });
  });
});

describe("setAuthCookie", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("calls response.cookies.set with the correct name and options", () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = NextResponse.json({});
    const setCookieSpy = vi.spyOn(response.cookies, "set");

    setAuthCookie(response, "my-token");

    expect(setCookieSpy).toHaveBeenCalledWith("auth-token", "my-token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  });

  it("sets secure:false in non-production environments", () => {
    vi.stubEnv("NODE_ENV", "test");
    const response = NextResponse.json({});
    const setCookieSpy = vi.spyOn(response.cookies, "set");

    setAuthCookie(response, "my-token");

    expect(setCookieSpy).toHaveBeenCalledWith(
      "auth-token",
      "my-token",
      expect.objectContaining({ secure: false })
    );
  });
});

describe("clearAuthCookie", () => {
  it("calls response.cookies.set with an empty value and maxAge 0", () => {
    const response = NextResponse.json({});
    const setCookieSpy = vi.spyOn(response.cookies, "set");

    clearAuthCookie(response);

    expect(setCookieSpy).toHaveBeenCalledWith("auth-token", "", {
      httpOnly: true,
      secure: expect.any(Boolean),
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
  });
});
