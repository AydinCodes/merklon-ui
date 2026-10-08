"use client";

import { useEffect, useId, useRef, type PointerEvent, type ReactElement, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { place, type Align, type Side } from "../lib/position";
import { Slot } from "../lib/slot";

/*
 * Shared across every tooltip on the page: once one is open, or has just
 * closed, the next opens immediately and without animation. Moving along a
 * toolbar should feel like reading labels, not waiting for each one.
 */
const WARM_WINDOW_MS = 400;
let openTooltips = 0;
let lastClosedAt = -Infinity;

export interface TooltipProps {
  content: ReactNode;
  /** The trigger. Must accept a ref and pointer/focus handlers (any DOM element or Button). */
  children: ReactElement;
  side?: Side;
  align?: Align;
  /** Hover delay before the first tooltip. Focus always shows instantly. */
  delay?: number;
  className?: string;
}

export function Tooltip({ content, children, side = "top", align = "center", delay = 400, className }: TooltipProps) {
  const id = useId();
  const tipRef = useRef<HTMLSpanElement>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const isOpen = useRef(false);

  const open = () => {
    const tip = tipRef.current;
    const anchor = anchorRef.current;
    if (!tip || !anchor || isOpen.current) return;
    const warm = openTooltips > 0 || performance.now() - lastClosedAt < WARM_WINDOW_MS;
    if (warm) {
      // A neighbour may still be fading out; cut it, so only one label shows.
      document.querySelectorAll(".mk-tooltip:not(:popover-open)").forEach((t) => t.setAttribute("data-instant", ""));
    }
    tip.toggleAttribute("data-instant", warm);
    tip.showPopover();
    place(anchor, tip, { side, align, offset: 6 });
    isOpen.current = true;
    openTooltips += 1;
  };

  const close = () => {
    window.clearTimeout(timer.current);
    if (!isOpen.current) return;
    tipRef.current?.hidePopover();
    isOpen.current = false;
    openTooltips -= 1;
    lastClosedAt = performance.now();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    // A label left floating while the page scrolls away is just noise.
    const onScroll = () => close();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, { capture: true });
      close();
    };
    // close only touches refs and module state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleOpen = (event: PointerEvent<HTMLElement>) => {
    // Hover means nothing on touch; a tap should just press the button.
    if (event.pointerType !== "mouse") return;
    anchorRef.current = event.currentTarget;
    const warm = openTooltips > 0 || performance.now() - lastClosedAt < WARM_WINDOW_MS;
    window.clearTimeout(timer.current);
    if (warm) open();
    else timer.current = window.setTimeout(open, delay);
  };

  return (
    <>
      <Slot
        aria-describedby={id}
        onPointerEnter={scheduleOpen}
        onPointerLeave={close}
        onPointerDown={close}
        onFocus={(event: { currentTarget: HTMLElement }) => {
          anchorRef.current = event.currentTarget;
          if (event.currentTarget.matches(":focus-visible")) open();
        }}
        onBlur={close}
      >
        {children}
      </Slot>
      {/* A span, so a tooltip can sit inside a paragraph without breaking the HTML. */}
      <span ref={tipRef} id={id} role="tooltip" popover="manual" className={cx("mk-tooltip", className)}>
        {content}
      </span>
    </>
  );
}
