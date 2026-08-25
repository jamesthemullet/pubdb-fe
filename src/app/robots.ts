import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pubs", "/docs", "/leaderboard", "/changelog", "/privacy", "/terms"],
        disallow: [
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
        ],
      },
    ],
    sitemap: "https://www.thepubdb.com/sitemap.xml",
  };
}
