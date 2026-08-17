/**
 * Cloudflare Turnstile server-side verification.
 * The client-side widget token is worthless until verified here, so never trust
 * a form POST that skips this call.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
}

export async function verifyTurnstile(
  token: string,
  remoteIp: string,
): Promise<{ ok: boolean; reason?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Fail CLOSED: a missing secret must never silently disable bot protection
    return { ok: false, reason: "server_misconfigured" };
  }

  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, remoteip: remoteIp }),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return { ok: false, reason: "verify_unavailable" };

  const data = (await res.json()) as TurnstileResponse;
  return data.success
    ? { ok: true }
    : { ok: false, reason: data["error-codes"]?.join(",") ?? "failed" };
}
