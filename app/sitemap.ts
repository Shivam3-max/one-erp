import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oneerp.example.com";

// Only the public, unauthenticated pages belong in the sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${siteUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
