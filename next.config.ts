import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./src/config/security";

const nextConfig: NextConfig = {
  poweredByHeader: false, // don't advertise the framework version
  reactStrictMode: true,
  // Fallback headers for any response the middleware matcher skips
  // (static assets, images). CSP itself is set per-request in middleware
  // because it carries a nonce.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ];
  },
};

export default nextConfig;
