/**
 * Centralised security policy. Every limit and header directive lives here so a
 * change is one diff, reviewed once, applied everywhere.
 */

export const RATE_LIMITS = {
  /** Booking form: 5 submissions per IP per hour (OWASP API4, resource exhaustion). */
  bookingForm: { limit: 5, windowMs: 60 * 60 * 1000 },
  /** Review submissions: 2 per authenticated customer per hour. */
  reviewForm: { limit: 2, windowMs: 60 * 60 * 1000 },
  /** General page traffic: 100 requests per IP per minute. */
  pages: { limit: 100, windowMs: 60 * 1000 },
} as const;

/** One review per customer per 30 days (timestamp throttling for fake-review resistance). */
export const REVIEW_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

const isDev = process.env.NODE_ENV !== "production";

/**
 * Strict CSP. Notes:
 *  - `nonce` + `strict-dynamic`: only scripts we emit (or they load) run; injected
 *    inline <script> is dead on arrival (XSS mitigation, OWASP A03).
 *  - challenges.cloudflare.com is the ONLY third-party origin (Turnstile).
 *  - frame-ancestors 'none': anti-clickjacking (supersedes X-Frame-Options).
 *  - form-action 'self': forms can never be redirected to an attacker origin.
 */
export function buildCsp(nonce: string): string {
  return [
    `default-src 'self'`,
    // 'unsafe-eval' is required by Next.js dev-mode HMR only, never shipped to prod
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    // Explicit, though it already inherits 'self' from default-src. Stated so the
    // hero video keeps working if default-src is ever tightened. Deliberately no
    // data:, which would be needed only for an inline video poster.
    `media-src 'self'`,
    `font-src 'self'`,
    `connect-src 'self' https://challenges.cloudflare.com`,
    `frame-src https://challenges.cloudflare.com`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

export const SECURITY_HEADERS: Record<string, string> = {
  // 2 years, preload-eligible. Submit to hstspreload.org after 1 week of stable HTTPS.
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};
