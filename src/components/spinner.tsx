import type { CSSProperties } from "react";
import { cx } from "../lib/cx";

export interface SpinnerProps {
  /** Pixel size. Defaults to 16, the inline icon size. */
  size?: number;
  /** Announced to screen readers. Pass null when a parent already says it is busy. */
  label?: string | null;
  className?: string;
}

export function Spinner({ size = 16, label = "Loading", className }: SpinnerProps) {
  return (
    <span
      className={cx("mk-spinner", className)}
      style={{ "--mk-spinner-size": `${size}px` } as CSSProperties}
      role={label ? "status" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
        <path d="M14.25 8A6.25 6.25 0 0 0 8 1.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
