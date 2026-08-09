import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/register",
          "/billing",
          "/settings",
          "/playground",
          "/profile",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: "https://www.thepubdb.com/sitemap.xml",
  };
}
