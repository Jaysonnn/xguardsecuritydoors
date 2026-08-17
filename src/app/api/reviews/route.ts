import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { reviewSchema, hashIp, validationError } from "@/lib/security";
import { consume, clientIpFrom } from "@/lib/rate-limiter";
import { RATE_LIMITS, REVIEW_COOLDOWN_MS } from "@/config/security";
import { verifyReviewToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/reviews returns public, APPROVED reviews only.
 */
export async function GET() {
  const reviews = await prisma.review.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      suburb: true,
      createdAt: true,
      customer: { select: { name: true } },
    },
  });
  return NextResponse.json({ reviews });
}

/**
 * POST /api/reviews accepts verified customers only.
 * Anti-fake-review controls, in order:
 *   1. Bearer JWT issued post-installation (cryptographic authentication)
 *   2. Customer must exist AND have is_verified_customer = true
 *   3. Per-customer rate limit + 30-day cooldown (timestamp throttling)
 *   4. Zod validation rejecting HTML/script content
 *   5. Review lands as PENDING_MODERATION, so a human approves before it's public
 *   6. IP hash logged for abuse correlation
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFrom(request.headers);

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const claims = token ? await verifyReviewToken(token) : null;
  if (!claims) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const rl = consume(
    `review:${claims.sub}`,
    RATE_LIMITS.reviewForm.limit,
    RATE_LIMITS.reviewForm.windowMs,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { id: claims.sub },
    select: { id: true, isVerifiedCustomer: true },
  });
  if (!customer?.isVerifiedCustomer) {
    // 403, not 404: the token was valid but this account may not review
    return NextResponse.json(
      { error: "Only verified customers can leave reviews." },
      { status: 403 },
    );
  }

  const lastReview = await prisma.review.findFirst({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (
    lastReview &&
    Date.now() - lastReview.createdAt.getTime() < REVIEW_COOLDOWN_MS
  ) {
    return NextResponse.json(
      { error: "You've already left a review recently." },
      { status: 429 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error.issues), { status: 422 });
  }

  const review = await prisma.review.create({
    data: {
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
      suburb: parsed.data.suburb || null,
      status: "PENDING_MODERATION",
      ipHash: hashIp(ip),
      customerId: customer.id,
    },
    select: { id: true },
  });

  return NextResponse.json(
    { ok: true, id: review.id, status: "pending_moderation" },
    { status: 201 },
  );
}
