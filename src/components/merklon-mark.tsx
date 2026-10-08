import { useId, type ComponentPropsWithRef } from "react";
import { cx } from "../lib/cx";

export interface MerklonMarkProps extends Omit<ComponentPropsWithRef<"svg">, "children"> {
  /** Rendered height in px; width follows the 5:3 artboard. */
  size?: number;
  /** "brand" uses the logo gradient; "mono" uses currentColor. */
  variant?: "brand" | "mono";
  /** Pass a label when the mark stands alone as a link or heading. */
  title?: string;
}

/**
 * The Merklon logo: two peaks joined by a centre facet. Its gradient comes
 * from tokens, lightening in dark mode so it holds contrast on black. Ids are
 * per-instance, so any number of marks can share a page.
 */
export function MerklonMark({ size = 24, variant = "brand", title, className, ...props }: MerklonMarkProps) {
  const id = useId().replace(/:/g, "");
  const fill = (n: number) => (variant === "brand" ? `url(#${id}-g${n})` : "currentColor");

  return (
    <svg
      {...props}
      viewBox="0 0 750 450"
      height={size}
      width={(size * 750) / 450}
      className={cx("mk-mark", className)}
      data-variant={variant}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {variant === "brand" && (
        <defs>
          <linearGradient id={`${id}-g1`} x1="-50" y1="-40" x2="0" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" className="mk-mark-from" />
            <stop offset="100%" className="mk-mark-to" />
          </linearGradient>
          <linearGradient id={`${id}-g2`} x1="0" y1="-40" x2="50" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" className="mk-mark-from" />
            <stop offset="100%" className="mk-mark-to" />
          </linearGradient>
          <linearGradient id={`${id}-g3`} x1="-30" y1="-20" x2="30" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" className="mk-mark-from" />
            <stop offset="100%" className="mk-mark-to" />
          </linearGradient>
        </defs>
      )}
      <g transform="matrix(7.5 0 0 7.5 375 300)">
        <path d="m -50,20 30,-60 20,20 -30,40 z" fill={fill(1)} />
        <path d="M 0,-20 20,-40 50,20 H 30 Z" fill={fill(2)} />
        <path d="M -30,20 0,-20 30,20 0,10 Z" fill={fill(3)} opacity="0.8" />
      </g>
    </svg>
  );
}
