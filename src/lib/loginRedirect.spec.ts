import { describe, expect, it } from "vitest";

import { getLoginHref, getRedirectFromSearch, getSafeRedirectPath } from "./loginRedirect";

const origin = "https://pubdb.example";

describe("getLoginHref", () => {
  it("adds the return path as a redirect param", () => {
    expect(getLoginHref("/pubs/abc")).toBe("/register?redirect=%2Fpubs%2Fabc");
  });

  it("keeps the query string of the return path", () => {
    expect(getLoginHref("/pubs?q=CR0&type=pub")).toBe(
      `/register?redirect=${encodeURIComponent("/pubs?q=CR0&type=pub")}`,
    );
  });

  it("returns the plain login path for home, missing or auth-page return paths", () => {
    expect(getLoginHref("/")).toBe("/register");
    expect(getLoginHref(null)).toBe("/register");
    expect(getLoginHref(undefined)).toBe("/register");
    expect(getLoginHref("/register")).toBe("/register");
    expect(getLoginHref("/forgot-password")).toBe("/register");
    expect(getLoginHref("/verify?token=x")).toBe("/register");
  });

  it("ignores values that are not paths", () => {
    expect(getLoginHref("https://evil.example/")).toBe("/register");
  });
});

describe("getSafeRedirectPath", () => {
  it("returns same-origin paths with search and hash", () => {
    expect(getSafeRedirectPath("/pubs/abc?x=1#map", origin)).toBe("/pubs/abc?x=1#map");
    expect(getSafeRedirectPath(`${origin}/pubs`, origin)).toBe("/pubs");
  });

  it("rejects other origins, including protocol-relative URLs", () => {
    expect(getSafeRedirectPath("https://evil.example/pubs", origin)).toBeNull();
    expect(getSafeRedirectPath("//evil.example/pubs", origin)).toBeNull();
  });

  it("rejects auth pages and empty values", () => {
    expect(getSafeRedirectPath("/register", origin)).toBeNull();
    expect(getSafeRedirectPath("/reset-password?token=x", origin)).toBeNull();
    expect(getSafeRedirectPath("", origin)).toBeNull();
    expect(getSafeRedirectPath(null, origin)).toBeNull();
  });
});

describe("getRedirectFromSearch", () => {
  it("reads and validates the redirect param", () => {
    expect(getRedirectFromSearch("?redirect=%2Fpubs%2Fabc", origin)).toBe("/pubs/abc");
    expect(getRedirectFromSearch("?redirect=https%3A%2F%2Fevil.example", origin)).toBeNull();
    expect(getRedirectFromSearch("", origin)).toBeNull();
  });
});
