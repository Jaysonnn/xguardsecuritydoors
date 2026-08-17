import { jwtVerify, SignJWT } from "jose";

/**
 * Minimal JWT layer for verified-customer actions (review submission).
 * Tokens are issued out-of-band: after an installation is completed, the admin
 * sends the customer a "leave a review" link containing a short-lived token.
 * No passwords are ever handled by this site.
 */

export interface CustomerClaims {
  sub: string; // Customer.id
  email: string;
  purpose: "review";
}

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function issueReviewToken(
  customerId: string,
  email: string,
): Promise<string> {
  return new SignJWT({ email, purpose: "review" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(customerId)
    .setIssuedAt()
    .setExpirationTime("14d")
    .setIssuer("xguard-site")
    .setAudience("xguard-reviews")
    .sign(secretKey());
}

export async function verifyReviewToken(
  token: string,
): Promise<CustomerClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"], // pinned, so no alg-confusion downgrade
      issuer: "xguard-site",
      audience: "xguard-reviews",
    });
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      payload.purpose !== "review"
    ) {
      return null;
    }
    return { sub: payload.sub, email: payload.email, purpose: "review" };
  } catch {
    return null; // expired, tampered, or malformed, all treated identically
  }
}
