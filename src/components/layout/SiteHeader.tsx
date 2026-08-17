"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { site } from "@/config/site";
import { CloseIcon, MenuIcon, PhoneIcon } from "@/components/ui/Icon";
import { NavDropdown } from "./NavDropdown";
import logo from "@/images/logo.png";
import styles from "./SiteHeader.module.css";

/**
 * Sticky site header. Closes the gap where the site previously had no call to
 * action at all above 900px, since the mobile call bar hides at that width.
 *
 * Both navs render unconditionally and CSS switches between them. Branching on
 * window.innerWidth during render would cause a hydration mismatch on this
 * dynamically rendered page, and display:none also removes the hidden one from
 * the tab order.
 */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Scroll lock goes on <html>. body carries padding-bottom for the call bar,
  // and locking body causes a scroll jump on iOS.
  useEffect(() => {
    if (!menuOpen) return;
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
  }, [menuOpen]);

  // Escape closes and returns focus, and focus is trapped while open.
  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        hamburgerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} onClick={closeMenu}>
          <Image src={logo} alt="" width={44} height={44} priority />
          <span className={styles.brandText}>
            <strong>XGUARD</strong>
            <span>Security Doors</span>
          </span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Main">
          <NavDropdown />
          <Link href="/gallery">Gallery</Link>
          <Link href="/#process">How it works</Link>
          <Link href="/#areas">Areas we cover</Link>
        </nav>

        <div className={styles.actions}>
          <a className={styles.phone} href={site.phoneHref}>
            <PhoneIcon size={18} />
            {site.phone}
          </a>
          <Link className={`btn btn-primary ${styles.cta}`} href="/#book">
            Free Quote
          </Link>
        </div>

        <button
          ref={hamburgerRef}
          type="button"
          className={styles.hamburger}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <div
        id="mobile-menu"
        ref={panelRef}
        className={styles.mobilePanel}
        data-open={menuOpen}
        hidden={!menuOpen}
      >
        <nav aria-label="Mobile">
          <p className={styles.mobileHeading}>Our Doors</p>
          <NavDropdown variant="mobile" onNavigate={closeMenu} />
          <div className={styles.mobileLinks}>
            <Link href="/gallery" onClick={closeMenu}>Gallery</Link>
            <Link href="/#process" onClick={closeMenu}>How it works</Link>
            <Link href="/#areas" onClick={closeMenu}>Areas we cover</Link>
          </div>
          <a className="btn btn-primary btn-block" href={site.phoneHref}>
            Call {site.phone}
          </a>
        </nav>
      </div>
    </header>
  );
}
