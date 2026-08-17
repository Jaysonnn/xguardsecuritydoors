"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import poster from "@/images/hero-poster.jpg";
import styles from "./hero.module.css";

/**
 * Background video for the hero.
 *
 * The poster is rendered as a priority next/image beneath the video rather than
 * through the `poster` attribute, so it gets a preload hint and AVIF/WebP. That
 * makes the poster the LCP element and means Largest Contentful Paint never
 * waits on video bytes.
 *
 * The <video> ships with no source at all. Sources are injected only after the
 * page has settled and only when the gate below passes, so on a phone the file
 * is never requested. That matters because most of this site's traffic is mobile
 * on cellular data, where a decorative background video costs conversions and
 * gives nothing back.
 */
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function shouldPlayVideo(): boolean {
      if (!window.matchMedia("(min-width: 900px)").matches) return false;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
      if (window.matchMedia("(update: slow)").matches) return false;

      const connection = (
        navigator as Navigator & {
          connection?: { saveData?: boolean; effectiveType?: string };
        }
      ).connection;
      if (connection?.saveData) return false;
      if (connection?.effectiveType && connection.effectiveType !== "4g") return false;

      return true;
    }

    let cancelled = false;

    function start() {
      if (cancelled || !video || !shouldPlayVideo()) return;

      const source = document.createElement("source");
      source.src = "/video/hero-loop.mp4";
      source.type = "video/mp4";
      video.appendChild(source);
      video.load();
      // Autoplay rejection is normal and must be handled, or it surfaces as an
      // unhandled promise rejection in the console.
      void video.play().catch(() => undefined);
    }

    // Wait for the page to settle so the video never competes with the poster
    // or the booking form for bandwidth. requestIdleCallback is typed as always
    // present but is missing in Safari before 16.4, hence the runtime check.
    const idleApi:
      | ((cb: IdleRequestCallback, opts?: IdleRequestOptions) => number)
      | undefined =
      "requestIdleCallback" in window
        ? window.requestIdleCallback.bind(window)
        : undefined;

    const handle = idleApi
      ? idleApi(start, { timeout: 2500 })
      : window.setTimeout(start, 1200);

    return () => {
      cancelled = true;
      if (idleApi) {
        window.cancelIdleCallback(handle);
      } else {
        window.clearTimeout(handle);
      }
    };
  }, []);

  // Stop decoding once the hero scrolls away. Saves battery and keeps the CPU
  // free while someone is filling in the booking form.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry || !video.currentSrc) return;
        if (entry.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.media} aria-hidden="true">
      <Image
        src={poster}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        style={{ objectFit: "cover" }}
      />
      <video
        ref={videoRef}
        className={styles.video}
        data-ready={ready}
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        tabIndex={-1}
        onCanPlay={() => setReady(true)}
      />
      <div className={styles.scrim} />
      <div className={styles.fade} />
    </div>
  );
}
