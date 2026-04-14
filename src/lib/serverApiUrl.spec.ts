import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getServerApiUrl } from "./serverApiUrl";

describe("getServerApiUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns API_URL when it is set", () => {
    process.env.API_URL = "https://server-api.example.com";
    expect(getServerApiUrl()).toBe("https://server-api.example.com");
  });

  it("falls back to NEXT_PUBLIC_API_URL when API_URL is not set", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://public-api.example.com";
    expect(getServerApiUrl()).toBe("https://public-api.example.com");
  });

  it("prefers API_URL over NEXT_PUBLIC_API_URL when both are set", () => {
    process.env.API_URL = "https://server-api.example.com";
    process.env.NEXT_PUBLIC_API_URL = "https://public-api.example.com";
    expect(getServerApiUrl()).toBe("https://server-api.example.com");
  });

  it("returns the localhost default when neither env var is set", () => {
    expect(getServerApiUrl()).toBe("http://localhost:4000");
  });
});
