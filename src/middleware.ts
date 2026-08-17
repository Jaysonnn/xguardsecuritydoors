import { NextRequest, NextResponse } from "next/server";
import { buildCsp, SECURITY_HEADERS, RATE_LIMITS } from "@/config/security";
import { consume, clientIpFrom } from "@/lib/rate-limiter";

/**
 * Runs on every request before rendering:
 *  1. Page-level rate limiting (100 req/min/IP).
 *  2. Per-request CSP nonce + full security header set.
 *
 * HSTS here is defence-in-depth. The authoritative copy must ALSO be set at
 * the edge (CloudFront response-headers policy) so error responses carry it.
 */
export function middleware(request: NextRequest) {
  const ip = clientIpFrom(request.headers);

  const { allowed, retryAfterSeconds } = consume(
    `pages:${ip}`,
    RATE_LIMITS.pages.limit,
    RATE_LIMITS.pages.windowMs,
  );
  if (!allowed) {
    return new NextResponse("Too many requests. Slow down.", {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds), ...SECURITY_HEADERS },
    });
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  // Skip static assets. They can't run scripts, and rate-limiting them breaks pages.
  // Video extensions matter especially: browsers fetch media over many HTTP Range
  // requests, so without them here a single visitor exhausts the per-minute page
  // budget and gets a 429 on the booking form.
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|avif|gif|webp|svg|ico|woff2|mp4|webm|m4v|mov|txt|xml|json|webmanifest)).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
