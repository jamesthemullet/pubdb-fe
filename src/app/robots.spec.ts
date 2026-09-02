import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("robots", () => {
  it("applies rules to all user agents with the correct allow and disallow lists", () => {
    const result = robots();

    expect(result.rules).toHaveLength(1);
    const [rule] = result.rules;

    expect(rule.userAgent).toBe("*");
    expect(rule.allow).toEqual([
      "/",
      "/pubs",
      "/docs",
      "/leaderboard",
      "/changelog",
      "/privacy",
      "/terms",
    ]);
    expect(rule.disallow).toEqual([
      "/profile",
      "/billing",
      "/settings",
      "/playground",
      "/add-pub",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/success",
      "/api/",
    ]);
  });

  it("points the sitemap to the canonical production URL", () => {
    const result = robots();
    expect(result.sitemap).toBe("https://www.thepubdb.com/sitemap.xml");
  });
});
