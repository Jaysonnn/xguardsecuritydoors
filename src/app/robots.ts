import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Replaces the old public/robots.txt, which hardcoded a domain and advertised a
 * sitemap that did not exist. Files in public/ are served ahead of App Router
 * routes, so that file had to be deleted for this to take effect.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
