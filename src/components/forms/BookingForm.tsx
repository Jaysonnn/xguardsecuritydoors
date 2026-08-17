"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { SERVICE_OPTIONS } from "@/config/services";

/**
 * 3-step booking form:
 *   1. What do you need?  2. Where are you?  3. Who are you? (+ Turnstile)
 * Client-side checks are UX only. The server re-validates everything with Zod.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          theme?: "dark" | "light";
        },
      ) => string;
    };
    onTurnstileLoad?: () => void;
  }
}

export function BookingForm() {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<string>("DIAMOND_DOOR");
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const widgetRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  const renderTurnstile = useCallback(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || !widgetRef.current || rendered.current || !window.turnstile) {
      return;
    }
    rendered.current = true;
    window.turnstile.render(widgetRef.current, {
      sitekey: siteKey,
      theme: "dark",
      callback: (token) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
    });
  }, []);

  useEffect(() => {
    window.onTurnstileLoad = renderTurnstile;
    if (step === 3) renderTurnstile();
    return () => {
      window.onTurnstileLoad = undefined;
    };
  }, [step, renderTurnstile]);

  function validateStep(current: number): boolean {
    const next: Record<string, string> = {};
    if (current === 2) {
      if (suburb.trim().length < 2) next.suburb = "Enter your suburb.";
      if (!/^3\d{3}$/.test(postcode.trim()))
        next.postcode = "Enter a Victorian postcode (3xxx).";
    }
    if (current === 3) {
      if (name.trim().length < 2) next.name = "Enter your name.";
      if (!/^(?:\+?61|0)[2-478](?:[ -]?\d){8}$/.test(phone.trim()))
        next.phone = "Enter a valid Australian phone number.";
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        next.email = "Enter a valid email or leave it blank.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateStep(3)) return;
    if (!turnstileToken) {
      setErrors({ turnstile: "Please complete the verification." });
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          suburb: suburb.trim(),
          postcode: postcode.trim(),
          message: message.trim(),
          turnstileToken,
          website: "", // honeypot stays empty for humans
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="form-card">
        <div className="form-success" role="status">
          <strong>Booking received!</strong> We&apos;ll call you back today to
          lock in your free measure. Urgent? Call us on 0431 980 897.
        </div>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={submit} noValidate>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit"
        strategy="lazyOnload"
      />

      <div className="form-progress" aria-hidden="true">
        <span className={step >= 1 ? "on" : ""} />
        <span className={step >= 2 ? "on" : ""} />
        <span className={step >= 3 ? "on" : ""} />
      </div>

      {step === 1 && (
        <fieldset style={{ border: "none" }}>
          <div className="field">
            <label htmlFor="service">What do you need?</label>
            <select
              id="service"
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              {SERVICE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="form-nav">
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => setStep(2)}
            >
              Next
            </button>
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset style={{ border: "none" }}>
          <div className="field">
            <label htmlFor="suburb">Your suburb</label>
            <input
              id="suburb"
              autoComplete="address-level2"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
            />
            {errors.suburb && <p className="field-error">{errors.suburb}</p>}
          </div>
          <div className="field">
            <label htmlFor="postcode">Postcode</label>
            <input
              id="postcode"
              inputMode="numeric"
              maxLength={4}
              autoComplete="postal-code"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
            />
            {errors.postcode && <p className="field-error">{errors.postcode}</p>}
          </div>
          <div className="form-nav">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => validateStep(2) && setStep(3)}
            >
              Next
            </button>
          </div>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset style={{ border: "none" }}>
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>
          <div className="field">
            <label htmlFor="phone">Mobile number</label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {errors.phone && <p className="field-error">{errors.phone}</p>}
          </div>
          <div className="field">
            <label htmlFor="email">Email (optional)</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>
          <div className="field">
            <label htmlFor="message">Anything else? (optional)</label>
            <textarea
              id="message"
              maxLength={1000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Honeypot, hidden from humans but tempting for bots */}
          <div className="honeypot" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="field">
            <div ref={widgetRef} />
            {errors.turnstile && <p className="field-error">{errors.turnstile}</p>}
          </div>

          {status === "error" && (
            <p className="field-error">
              Something went wrong. Please call us on 0431 980 897.
            </p>
          )}

          <div className="form-nav">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
              Back
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending..." : "Book my free measure"}
            </button>
          </div>
        </fieldset>
      )}
    </form>
  );
}
