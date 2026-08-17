import type { MetadataRoute } from "next";
import { DOOR_CATEGORIES } from "@/config/doors";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "monthly", priority: 1 },
    {
      url: `${base}/gallery`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    // Each category is its own landing page, which is where local search traffic
    // for terms like "diamond security doors melbourne" actually lands.
    ...DOOR_CATEGORIES.map((category) => ({
      url: `${base}/gallery/${category.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
