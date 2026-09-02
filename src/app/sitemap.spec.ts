import { describe, expect, it } from "vitest";

import sitemap from "./sitemap";

const BASE = "https://www.thepubdb.com";

describe("sitemap", () => {
  it("returns exactly the expected public URLs in order", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual([
      BASE,
      `${BASE}/pubs`,
      `${BASE}/docs`,
      `${BASE}/leaderboard`,
      `${BASE}/changelog`,
      `${BASE}/privacy`,
      `${BASE}/terms`,
    ]);
  });

  it("assigns correct priorities and change frequencies to each entry", () => {
    const entries = sitemap();
    const byUrl = Object.fromEntries(entries.map((e) => [e.url, e]));

    expect(byUrl[BASE].priority).toBe(1);
    expect(byUrl[BASE].changeFrequency).toBe("weekly");

    expect(byUrl[`${BASE}/pubs`].priority).toBe(0.9);
    expect(byUrl[`${BASE}/pubs`].changeFrequency).toBe("daily");

    expect(byUrl[`${BASE}/leaderboard`].priority).toBe(0.7);
    expect(byUrl[`${BASE}/leaderboard`].changeFrequency).toBe("daily");

    expect(byUrl[`${BASE}/privacy`].priority).toBe(0.3);
    expect(byUrl[`${BASE}/privacy`].changeFrequency).toBe("yearly");

    expect(byUrl[`${BASE}/terms`].priority).toBe(0.3);
    expect(byUrl[`${BASE}/terms`].changeFrequency).toBe("yearly");
  });
});
