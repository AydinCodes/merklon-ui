export type Side = "top" | "bottom" | "left" | "right";
export type Align = "start" | "center" | "end";

const opposite: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/**
 * Places a fixed-position floating element next to its anchor, flipping to
 * the other side when it would not fit, and clamping inside the viewport.
 *
 * Also writes --mk-origin, the point on the floating element nearest the
 * anchor, so it scales out of the thing that opened it (spatial consistency)
 * rather than out of its own centre.
 */
export function place(
  anchor: Element,
  floating: HTMLElement,
  { side = "bottom", align = "center", offset = 6, padding = 8 }: { side?: Side; align?: Align; offset?: number; padding?: number } = {}
) {
  const a = anchor.getBoundingClientRect();
  // offsetWidth ignores the entry transform, so a mid-animation scale does not skew the maths.
  const w = floating.offsetWidth;
  const h = floating.offsetHeight;
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;

  const fits: Record<Side, boolean> = {
    top: a.top - offset - h >= padding,
    bottom: a.bottom + offset + h <= vh - padding,
    left: a.left - offset - w >= padding,
    right: a.right + offset + w <= vw - padding,
  };
  const resolved = !fits[side] && fits[opposite[side]] ? opposite[side] : side;

  let x: number;
  let y: number;
  if (resolved === "top" || resolved === "bottom") {
    y = resolved === "top" ? a.top - offset - h : a.bottom + offset;
    x = align === "start" ? a.left : align === "end" ? a.right - w : a.left + a.width / 2 - w / 2;
  } else {
    x = resolved === "left" ? a.left - offset - w : a.right + offset;
    y = align === "start" ? a.top : align === "end" ? a.bottom - h : a.top + a.height / 2 - h / 2;
  }

  x = clamp(x, padding, vw - w - padding);
  y = clamp(y, padding, vh - h - padding);

  const ox = clamp(a.left + a.width / 2 - x, 0, w);
  const oy = clamp(a.top + a.height / 2 - y, 0, h);
  const origin =
    resolved === "top" ? `${ox}px ${h}px` : resolved === "bottom" ? `${ox}px 0px` : resolved === "left" ? `${w}px ${oy}px` : `0px ${oy}px`;

  floating.style.left = `${Math.round(x)}px`;
  floating.style.top = `${Math.round(y)}px`;
  floating.style.setProperty("--mk-origin", origin);
  floating.dataset.side = resolved;
  return resolved;
}

/**
 * Keeps a fixed-position popover attached to its anchor while the page
 * scrolls or the viewport changes (including the on-screen keyboard on
 * phones). Re-places at most once per frame. Returns a cleanup function.
 */
export function trackAnchor(anchor: Element, floating: HTMLElement, options: Parameters<typeof place>[2] = {}) {
  let frame = 0;
  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => place(anchor, floating, options));
  };
  window.addEventListener("scroll", update, { capture: true, passive: true });
  window.addEventListener("resize", update, { passive: true });
  window.visualViewport?.addEventListener("resize", update, { passive: true });
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", update, { capture: true });
    window.removeEventListener("resize", update);
    window.visualViewport?.removeEventListener("resize", update);
  };
}
