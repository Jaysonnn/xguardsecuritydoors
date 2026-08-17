import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bookingSchema, hashIp, validationError } from "@/lib/security";
import { consume, clientIpFrom } from "@/lib/rate-limiter";
import { RATE_LIMITS } from "@/config/security";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/booking is the only write path for the public booking form.
 * Order of gates matters: cheap checks first, DB write last.
 *   rate limit -> content-type -> honeypot -> Zod -> Turnstile -> Prisma create
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFrom(request.headers);

  // Gate 1: 5 submissions per IP per hour
  const rl = consume(
    `booking:${ip}`,
    RATE_LIMITS.bookingForm.limit,
    RATE_LIMITS.bookingForm.windowMs,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many booking requests. Please call us instead." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  // Gate 2: strict content type (blocks CSRF-style form-encoded cross-origin posts)
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Gate 3: schema validation (rejects HTML/script content, unknown keys, honeypot)
  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error.issues), { status: 422 });
  }
  const data = parsed.data;

  // Gate 4: Turnstile bot check (server-side; the widget alone proves nothing)
  const turnstile = await verifyTurnstile(data.turnstileToken, ip);
  if (!turnstile.ok) {
    return NextResponse.json(
      { error: "Bot verification failed. Refresh and try again." },
      { status: 403 },
    );
  }

  // Gate 5: parameterised write via Prisma (no string-built SQL anywhere)
  try {
    const booking = await prisma.booking.create({
      data: {
        service: data.service,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        suburb: data.suburb,
        postcode: data.postcode,
        message: data.message || null,
        preferredAt: data.preferredAt ?? null,
        ipHash: hashIp(ip),
        userAgent: request.headers.get("user-agent")?.slice(0, 255) ?? null,
      },
      select: { id: true }, // never echo stored PII back
    });

    return NextResponse.json(
      { ok: true, reference: booking.id },
      { status: 201 },
    );
  } catch (err) {
    console.error("booking_create_failed", err); // detail stays server-side
    return NextResponse.json(
      { error: "We couldn't save your booking. Please call 0431 980 897." },
      { status: 500 },
    );
  }
}
