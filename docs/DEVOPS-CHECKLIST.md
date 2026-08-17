# XGuard — Secure Domain & Infrastructure Checklist (AWS, ap-southeast-2)

Work top to bottom. Items marked 🔑 need account-owner access.

## 1. Domain & DNS (Route 53)

- [ ] 🔑 Register / transfer `xguardsecuritydoors.com.au` into Route 53 (or keep
      registrar and delegate NS to a Route 53 hosted zone).
- [ ] **DNSSEC** — in Route 53: hosted zone → *DNSSEC signing* → enable.
      Route 53 creates a KSK backed by KMS (`ap-southeast-2` KMS key, ~US$1/mo).
- [ ] 🔑 Copy the generated **DS record** to the parent zone via your `.com.au`
      registrar (auDA registrars support this; if yours doesn't, transfer to one
      that does). Without the DS record at the parent, DNSSEC is not active.
- [ ] Verify: `dig +dnssec xguardsecuritydoors.com.au` shows `ad` flag, and
      https://dnsviz.net shows a fully signed chain.
- [ ] Set **CAA record** so only your CA can issue certs:
      `xguardsecuritydoors.com.au. CAA 0 issue "amazon.com"`
- [ ] SPF/DKIM/DMARC even before you send mail (stops spoofed quotes):
      - `TXT "v=spf1 include:amazonses.com -all"`
      - `_dmarc TXT "v=DMARC1; p=reject; rua=mailto:dmarc@xguardsecuritydoors.com.au"`

## 2. TLS 1.3 & certificates (ACM + CloudFront)

- [ ] Request a public cert in **ACM us-east-1** (CloudFront requirement) for
      `xguardsecuritydoors.com.au` + `www.` — DNS validation, auto-renewal. Never
      handle private keys manually.
- [ ] CloudFront distribution security policy: **TLSv1.2_2021 minimum**
      (negotiates TLS 1.3 with modern clients; there is no 1.3-only policy —
      1.2_2021 is the modern baseline and keeps older Android buyers working).
- [ ] HTTP → HTTPS: set *Viewer protocol policy = Redirect to HTTPS*.
- [ ] Verify with SSL Labs (target A+): https://www.ssllabs.com/ssltest/

## 3. HSTS preload

- [ ] Header is already emitted by the app:
      `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- [ ] Also attach it via a CloudFront **response headers policy** so error and
      static responses carry it.
- [ ] Run HTTPS-only for at least a week, confirm `www` and apex both redirect
      cleanly, THEN submit at https://hstspreload.org. ⚠️ Preload is
      effectively permanent — every future subdomain must be HTTPS.

## 4. Hosting (choose one)

**Recommended: AWS Amplify Hosting (SSR)** — cheapest way to run Next.js
server-side in `ap-southeast-2` with CI/CD from GitHub built in.
Alternative: SST/OpenNext on Lambda + CloudFront (more control, more setup).
Avoid a raw EC2 box — you'd own OS patching for no benefit at this scale.

- [ ] Connect the GitHub repo; every push to `main` deploys after CI passes.
- [ ] Store secrets (`DATABASE_URL`, `TURNSTILE_SECRET_KEY`, `JWT_SECRET`) in
      **SSM Parameter Store (SecureString)** / Amplify env vars — never in git.
- [ ] Note: on Lambda-style hosting the in-memory rate limiter under-counts
      across instances — move it to ElastiCache/Upstash Redis before launch,
      and keep **AWS WAF rate rules** (below) as the outer wall either way.

## 5. Database (RDS PostgreSQL)

- [ ] RDS PostgreSQL 16, `db.t4g.micro`, **not publicly accessible**, same VPC
      as compute; security group allows 5432 from app only.
- [ ] Encryption at rest (KMS) + automated backups 7 days + deletion protection.
- [ ] App connects with a least-privilege user (no CREATE/DROP in prod);
      migrations run in CI with a separate migration role.

## 6. Edge protection (WAF)

- [ ] Attach **AWS WAF** to CloudFront with managed rule sets:
      `AWSManagedRulesCommonRuleSet`, `KnownBadInputsRuleSet`, `IpReputationList`.
- [ ] WAF rate-based rule: block IPs over 300 req/5min (outer wall; the app's
      limiter is the fine-grained inner wall).

## 7. CI/CD security (.github/workflows)

- [ ] `npm audit --audit-level=high` + `npx tsc --noEmit` on every PR.
- [ ] Dependabot or Renovate for dependency updates.
- [ ] Gitleaks secret scanning on every push.
- [ ] Branch protection on `main`: PR + green checks required.

## 8. Ongoing

- [ ] Uptime + form-success monitoring (Pingdom/UptimeRobot free tier is fine).
- [ ] CloudWatch alarm on 5xx spikes and on booking-API 429 spikes (attack signal).
- [ ] Quarterly: re-run SSL Labs, Mozilla Observatory, and
      https://securityheaders.com (target A+ on all three).
- [ ] 90-day retention job for `ipHash`/`userAgent` on bookings (privacy hygiene).
