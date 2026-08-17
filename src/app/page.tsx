import Link from "next/link";
import { site } from "@/config/site";
import { BookingForm } from "@/components/forms/BookingForm";
import { CategoryCards } from "@/components/gallery/CategoryCards";
import { HeroVideo } from "@/components/hero/HeroVideo";
import { ArrowDownIcon, MessageIcon, PhoneIcon } from "@/components/ui/Icon";
import heroStyles from "@/components/hero/hero.module.css";

export default function HomePage() {
  return (
    <main id="main">
      {/* ---------- HERO ---------- */}
      <section className="hero">
        <HeroVideo />

        <div className="shell hero-content">
          <span className="hero-kicker">
            Break-ins across Victoria are still around 31% higher than in 2021
          </span>
          <h1>
            Custom Security Doors,
            <br />
            <span className="accent">Made and Installed</span> in Melbourne&apos;s West
          </h1>
          <p className="hero-sub">
            Measured to your frame, built to order, and fitted by the same person
            who quoted it. Local to {site.baseLocality}, covering Brimbank, Melton
            and Wyndham.
          </p>

          <a className="hero-phone" href={site.phoneHref}>
            <PhoneIcon size={28} />
            {site.phone}
          </a>

          <div className="hero-ctas">
            <a className="btn btn-primary" href={site.smsHref}>
              <MessageIcon size={20} />
              Text us a photo of your door
            </a>
            <Link className="btn btn-ghost" href="#book">
              Get a free quote
            </Link>
          </div>

          <div className="badges">
            {site.usp.map((item) => (
              <div className="badge" key={item}>
                <span className="tick">✔</span> {item}
              </div>
            ))}
          </div>
        </div>

        <a className={heroStyles.scrollCue} href="#gallery">
          See our work
          <span>
            <ArrowDownIcon size={18} />
          </span>
        </a>
      </section>

      {/* ---------- GALLERY ---------- */}
      <section id="gallery">
        <div className="shell">
          <h2 className="section-title">Doors we have made and fitted</h2>
          <p className="section-sub">
            Every photo below is our own work in {site.serviceRegion}, not stock
            imagery. Pick a style to see more.
          </p>
          <CategoryCards limit={6} />
          <p style={{ marginTop: "2rem" }}>
            <Link className="btn btn-ghost" href="/gallery">
              View all door types
            </Link>
          </p>
        </div>
      </section>

      {/* ---------- 3-STEP PROCESS ---------- */}
      <section id="process">
        <div className="shell">
          <h2 className="section-title">Secured in 3 simple steps</h2>
          <p className="section-sub">
            No showroom visits and no pushy sales. Send a photo or book below, and
            we handle the rest.
          </p>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <h3>Book a free measure</h3>
              <p>
                Pick a time that suits. We come to you, measure the frame, and
                quote on the spot with no obligation.
              </p>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <h3>We build it to fit</h3>
              <p>
                Your door is custom made for your exact opening, in the style,
                mesh and colour you choose.
              </p>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <h3>Professional install</h3>
              <p>
                Fitted, aligned and lock tested by our installer, so you get a
                door that actually does its job.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- BOOKING FORM ---------- */}
      <section id="book" style={{ background: "var(--ink-raised)" }}>
        <div className="shell">
          <h2 className="section-title">Book your free measure and quote</h2>
          <p className="section-sub">
            Three quick questions, under a minute. We reply the same day.
          </p>
          <BookingForm />
        </div>
      </section>

      {/* ---------- SERVICE AREAS ---------- */}
      <section id="areas">
        <div className="shell">
          <h2 className="section-title">Servicing {site.serviceRegion}</h2>
          <p className="section-sub">
            Based in {site.baseLocality}, with fast callouts across the western
            suburbs. Not listed? Call us, we probably still cover you.
          </p>
          <div className="areas">
            {site.serviceAreas.map((suburb) => (
              <span className="area" key={suburb}>
                {suburb}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
