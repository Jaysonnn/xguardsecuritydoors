"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/ui/Icon";
import { DOOR_CATEGORIES } from "@/config/doors";
import styles from "./NavDropdown.module.css";

/**
 * "Our Doors" disclosure.
 *
 * Uses the disclosure navigation pattern (button + list of links), not
 * role="menu". role="menu" tells a screen reader this is an application menu and
 * switches its interaction mode, which is wrong for site navigation and not what
 * users expect.
 *
 * Built on React state rather than <details> because the requirements include
 * Escape-to-close, outside-click close, arrow-key roving and focus return, none
 * of which <details> provides.
 */
interface NavDropdownProps {
  /**
   * "mobile" renders the list permanently expanded inside the hamburger panel,
   * with no trigger. Without this the links would keep tabIndex -1 while
   * visible, which is unreachable by keyboard.
   */
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

export function NavDropdown({ variant = "desktop", onNavigate }: NavDropdownProps) {
  const isMobile = variant === "mobile";
  const [open, setOpen] = useState(false);
  const expanded = isMobile || open;
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const focusItem = useCallback((index: number) => {
    const items = itemRefs.current.filter(Boolean);
    if (items.length === 0) return;
    const wrapped = (index + items.length) % items.length;
    items[wrapped]?.focus();
  }, []);

  // Outside interaction closes. pointerdown rather than click, because click
  // fires after focus has already moved and misbehaves under a sticky header.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Crossing the breakpoint while open would leave an orphaned panel
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(max-width: 899.98px)");
    const onChange = () => setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open]);

  function onTriggerKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusItem(0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusItem(-1));
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close(true);
    }
  }

  function onPanelKeyDown(event: React.KeyboardEvent, index: number) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusItem(index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusItem(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusItem(0);
        break;
      case "End":
        event.preventDefault();
        focusItem(-1);
        break;
      case "Escape":
        event.preventDefault();
        close(true);
        break;
      case "Tab":
        // Leaving the last item closes and lets focus continue naturally
        if (!event.shiftKey && index === DOOR_CATEGORIES.length - 1) {
          setOpen(false);
        }
        break;
    }
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {!isMobile && (
        <button
          ref={triggerRef}
          type="button"
          className={styles.trigger}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={onTriggerKeyDown}
        >
          Our Doors
          <ChevronDownIcon className={open ? styles.chevronOpen : styles.chevron} />
        </button>
      )}

      <ul
        id={panelId}
        className={styles.panel}
        data-open={expanded}
        // visibility:hidden in CSS also removes these from the tab order,
        // which opacity alone would not do
      >
        {DOOR_CATEGORIES.map((category, index) => (
          <li key={category.slug}>
            <Link
              href={`/gallery/${category.slug}`}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              tabIndex={expanded ? 0 : -1}
              onKeyDown={(e) => onPanelKeyDown(e, index)}
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
