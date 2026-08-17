import { z } from "zod";
import { createHash } from "crypto";
import { ServiceType } from "@prisma/client";

/**
 * Input validation and sanitisation (OWASP A03, Injection).
 *
 * Strategy: REJECT, don't clean. Any input containing HTML angle brackets,
 * script fragments, or event-handler patterns is refused outright. We never
 * try to "strip tags" (strip-and-keep is how mutation XSS slips through).
 * SQL injection is covered by Prisma's parameterised queries; validation here
 * is defence-in-depth plus data quality.
 */

const HTML_OR_SCRIPT = /<|>|&#|&lt|&gt|javascript:|data:text\/html|on\w+\s*=/i;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export function safeText(min: number, max: number) {
  return z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((v) => !HTML_OR_SCRIPT.test(v), {
      message: "Input must not contain HTML or script content.",
    })
    .refine((v) => !CONTROL_CHARS.test(v), {
      message: "Input contains invalid characters.",
    });
}

const AU_MOBILE_OR_LANDLINE = /^(?:\+?61|0)[2-478](?:[ -]?\d){8}$/;

export const bookingSchema = z
  .object({
    // Derived from the Prisma enum rather than restated, so the validator and the
    // database column can never drift apart and start rejecting valid bookings.
    service: z.nativeEnum(ServiceType),
    name: safeText(2, 100),
    phone: z
      .string()
      .trim()
      .regex(AU_MOBILE_OR_LANDLINE, "Enter a valid Australian phone number."),
    email: z.string().trim().email().max(254).optional().or(z.literal("")),
    suburb: safeText(2, 80),
    postcode: z.string().trim().regex(/^3\d{3}$/, "Enter a Victorian postcode."),
    message: safeText(0, 1000).optional().or(z.literal("")),
    preferredAt: z.coerce.date().optional(),
    turnstileToken: z.string().min(10).max(2048),
    // Honeypot. Humans never fill this hidden field
    website: z.literal("").optional(),
  })
  .strict(); // unknown keys rejected (mass-assignment guard)

export type BookingInput = z.infer<typeof bookingSchema>;

export const reviewSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    title: safeText(3, 120),
    body: safeText(20, 2000),
    suburb: safeText(2, 80).optional().or(z.literal("")),
  })
  .strict();

export type ReviewInput = z.infer<typeof reviewSchema>;

/** IPs are stored hashed (privacy-by-design) but remain matchable for abuse triage. */
export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + (process.env.JWT_SECRET ?? ""))
    .digest("hex");
}

/** Uniform error payload. Never echo internals or stack traces to the client. */
export function validationError(issues: z.ZodIssue[]) {
  return {
    error: "Validation failed",
    fields: issues.map((i) => ({ path: i.path.join("."), message: i.message })),
  };
}
