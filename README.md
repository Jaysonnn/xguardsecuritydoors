# XGuard Security Doors, Website

Desktop-first (mobile friendly) conversion site for XGuard Security Doors &
Roller Shutters, Melbourne's west. Next.js 15 App Router, strict TypeScript,
hardened to OWASP Top 10.

Business details are verified against ABN Lookup and live in
[`src/config/site.ts`](src/config/site.ts). ABN 12 983 909 072, registered
business name of Gia Tuyet Cao, sole trader, GST registered since 1 Jul 2025.

## Stack

- **Next.js 15 (App Router)** + React 19, strict TypeScript
- **Prisma + PostgreSQL** (AWS RDS in prod), parameterised queries only
- **Zod** server-side validation that rejects HTML and script input outright
- **Cloudflare Turnstile** bot protection on the booking form
- **jose (JWT)** verified-customer review tokens
- Nonce-based **CSP**, HSTS preload, rate limiting in `src/middleware.ts`
- No UI dependencies. The CSP uses `'strict-dynamic'`, so third-party UI
  libraries cannot execute. The dropdown and lightbox are hand-built.

## Getting started

```bash
npm install
cp .env.example .env   # fill in real values
npx prisma migrate dev
npm run dev
```

Do not run `npm run build` while `npm run dev` is running. They share `.next/`
and the build will corrupt the dev server. Stop dev first, or `rm -rf .next`
afterwards.

## Adding gallery photos

Source photos live outside the repo, at
`~/Desktop/Xguard Security Doors & Roller Shutters/`, one folder per product.
Drop new photos into the matching folder, then:

```bash
node scripts/prepare-images.mjs
```

The script converts HEIC to JPEG with `sips`, resizes to 1600px, strips EXIF
(which removes the GPS coordinates iPhones embed at customer homes), and
rewrites `src/config/doors.generated.ts`. Pass `--force` to re-encode everything.

Two things worth knowing:

- **HEIC must be converted.** No browser except Safari renders it, and the
  prebuilt `sharp` binary only decodes `.avif`, not `.heic`. Hence the two-stage
  pipeline.
- **Images live in `src/images/`, not `public/`,** so they can be statically
  imported. That gives Next the intrinsic dimensions and a blur placeholder for
  free, which is what keeps layout shift at zero across a mixed portrait and
  landscape photo set.

Human-written copy (names, blurbs, prices) lives in
[`src/config/doors.ts`](src/config/doors.ts) and survives regeneration.

## Replacing the hero video

Generate a 16:9 clip, then encode it. Keep it dark: the headline sits over it.

```bash
ffmpeg -y -i raw.mp4 -an -vf "scale=1600:-2,eq=brightness=-0.17:saturation=0.85:contrast=1.06" -c:v libx264 -profile:v high -crf 27 -preset slow -movflags +faststart public/video/hero-loop.mp4
```

Then extract a poster frame to `src/images/hero-poster.jpg`. Budget under 1.5 MB.
The video never loads below 900px wide, on reduced motion, or on a metered
connection, so mobile visitors only ever download the poster.

## Security map

| Concern | Where |
|---|---|
| CSP, HSTS, clickjacking, page rate limit | `src/middleware.ts`, `src/config/security.ts` |
| Input validation and XSS rejection | `src/lib/security.ts` |
| Booking endpoint (5/hr/IP, Turnstile, Zod, Prisma) | `src/app/api/booking/route.ts` |
| Verified-customer reviews and moderation queue | `src/app/api/reviews/route.ts`, `src/lib/auth.ts` |
| Flood protection store | `src/lib/rate-limiter.ts` |
| Infra hardening (DNSSEC, TLS 1.3, WAF) | `docs/DEVOPS-CHECKLIST.md` |

`ServiceType` is defined once in `prisma/schema.prisma`. The Zod validator
derives from it via `z.nativeEnum`, and `src/config/services.ts` types the form
options against it, so the three cannot drift apart.

## Before launch

1. **Set `NEXT_PUBLIC_SITE_URL`** in the deploy environment. Without it, sitemap,
   robots and every social share URL point at localhost.
2. **Add prices** to `fromPrice` in `src/config/doors.ts`. They must be
   GST inclusive, since advertised consumer prices are a single-price obligation
   under Australian Consumer Law.
3. **Confirm AS 5039 / AS 5041 certification** with your supplier before any
   compliance claim goes on the site. Do not publish a claim you cannot evidence.
4. Create Turnstile keys and a real `JWT_SECRET` and `DATABASE_URL`.
5. Work through `docs/DEVOPS-CHECKLIST.md`.
6. See `docs/MARKETING-PLAN.md` for the conversion and SEO plan.
