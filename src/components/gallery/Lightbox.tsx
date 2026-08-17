"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryPhoto } from "@/config/doors";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from "@/components/ui/Icon";
import styles from "./gallery.module.css";

/**
 * Photo grid with an enlarging lightbox.
 *
 * The lightbox is a native <dialog> opened with showModal(), which provides the
 * focus trap, Escape handling, focus restore and backdrop for free. It also
 * renders in the browser's top layer, so it cannot lose a stacking fight with
 * the sticky header or the fixed call bar.
 */
export function Lightbox({ photos }: { photos: GalleryPhoto[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const step = useCallback(
    (delta: number) => {
      setIndex((current) => {
        if (current === null) return current;
        return (current + delta + photos.length) % photos.length;
      });
    },
    [photos.length],
  );

  // showModal is imperative, so it has to run in an effect rather than render.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (index !== null && !dialog.open) dialog.showModal();
  }, [index]);

  // Scroll lock on <html>, matching the header. body carries the call bar padding.
  useEffect(() => {
    if (index === null) return;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [index, step]);

  /** Fires for Escape and for close(), so focus restore lives in one place. */
  function onDialogClose() {
    const previous = index;
    setIndex(null);
    if (previous !== null) triggerRefs.current[previous]?.focus();
  }

  const active = index === null ? null : photos[index];

  return (
    <>
      <ul className={styles.grid}>
        {photos.map((photo, i) => (
          <li key={photo.id}>
            <button
              type="button"
              className={styles.tile}
              ref={(el) => {
                triggerRefs.current[i] = el;
              }}
              onClick={() => setIndex(i)}
              aria-label={`Enlarge photo ${i + 1} of ${photos.length}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                placeholder="blur"
                sizes="(min-width: 1200px) 22vw, (min-width: 900px) 30vw, (min-width: 600px) 45vw, 92vw"
                style={{ objectFit: "cover" }}
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog ref={dialogRef} className={styles.dialog} onClose={onDialogClose}>
        {active && (
          <div className={styles.dialogInner}>
            <div className={styles.dialogImage}>
              <Image
                src={active.src}
                alt={active.alt}
                placeholder="blur"
                sizes="90vw"
                quality={85}
                style={{
                  width: "100%",
                  height: "auto",
                  maxHeight: "80vh",
                  objectFit: "contain",
                }}
              />
            </div>

            <p className={styles.counter}>
              {(index ?? 0) + 1} of {photos.length}
            </p>

            <button
              type="button"
              className={`${styles.navButton} ${styles.prev}`}
              onClick={() => step(-1)}
              aria-label="Previous photo"
            >
              <ArrowLeftIcon />
            </button>
            <button
              type="button"
              className={`${styles.navButton} ${styles.next}`}
              onClick={() => step(1)}
              aria-label="Next photo"
            >
              <ArrowRightIcon />
            </button>
            <button
              type="button"
              className={styles.closeButton}
              onClick={close}
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
