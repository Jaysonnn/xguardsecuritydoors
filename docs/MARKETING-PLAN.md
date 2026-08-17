# XGuard — Conversion & Viral Marketing Plan (Melbourne West)

Brand voice: local, blunt, protective. "We're the neighbours who make doors
burglars skip." Colours: logo black / signal red / steel white everywhere.

## 1. The hook: Melbourne's break-in wave

Victoria's burglary numbers are front-page news — that fear is the traffic.
Rules: use **real CSA (Crime Statistics Agency Victoria) numbers with a source
link**, per suburb where possible. Scary-but-true converts; fake stats get you
roasted in comments and hurt Google E-E-A-T.

Content angles (each becomes a Reel + a blog post + a suburb page section):
- "X burglaries in Point Cook last quarter. Here's the door most of them walked through."
- CCTV-style POV: how long a standard flyscreen door takes to open vs an XGuard door (crowbar test on YOUR OWN demo frame — great viral format).
- "5 things burglars check before picking a house" (locksmith-style authority content).
- Before/after installs with the homeowner's one-line reaction.
- "We can't stop rain. We can stop this." over slow-mo mesh stress test.

## 2. Instagram → website engine

- Every Reel ends with the same CTA: "Text a photo of your door to 0431 980 897
  for a same-day quote." Low-friction, phone-native, no form needed.
- Link-in-bio goes to `/book` (the 3-step form), not the homepage.
- Post install photos tagged by suburb — this doubles as local SEO fodder.
- Ask every happy customer for a 15-second phone video at handover; that's the
  highest-converting ad unit you'll ever get, free.

## 3. Local SEO (the compounding channel)

- **Google Business Profile first** — most "security doors near me" conversions
  happen on Maps, not the website. Photos weekly, reviews > 20, Q&A seeded.
- Suburb landing pages: `/security-doors-point-cook`, `/security-doors-werribee`…
  Same template, unique copy + local crime stat + local install photos.
  (Structure supports this: `src/app/[suburb]/page.tsx` later.)
- Blog for question keywords: "are security doors worth it", "security door
  prices Melbourne", "steel vs aluminium security door". One post/fortnight.
- Schema.org `LocalBusiness` + `Service` + `Review` JSON-LD (add to layout once
  ABN/address confirmed).
- Reviews on the site must be genuine verified customers (already enforced by
  the reviews API) — mark them up with `Review` schema for stars in search.

## 4. Conversion rules on-site

- Phone number visible in the first viewport, always tappable.
- SMS CTA ("text a photo") outperforms forms for tradie services — keep it as
  the primary red button; the form is the secondary path.
- 3-step form: never ask name/phone first — commitment builds by step 3.
- Same-day reply promise stated next to every CTA (then actually honour it).
- Floating call/text bar on mobile only — desktop gets header phone number.
- Add urgency honestly: "Currently booking measures for next week in 3xxx".

## 5. Paid (once organic is running)

- Google Ads: exact-match "security doors melbourne west" + suburb terms only;
  send to matching suburb page, not homepage. Start ~$20/day, watch call
  conversions (use a call-tracking number that forwards to 0431 980 897).
- Meta: retarget site visitors with the crowbar-test Reel. Lookalike off the
  customer list later.

## 6. Measure

- Events to track: call taps, SMS taps, form step-1 starts, form completes.
  (Add a privacy-friendly analytics tool — Plausible/Fathom — keeps CSP tight;
  GA4 needs extra CSP origins and a cookie banner.)
- North star: cost per booked measure. Review weekly.
