import type { ComponentPropsWithRef } from "react";
import { cx } from "../lib/cx";
import type { Tone } from "../lib/types";

export type BadgeVariant = "neutral" | "accent" | "success" | "warning" | "danger" | "outline";

export interface BadgeProps extends ComponentPropsWithRef<"span"> {
  variant?: BadgeVariant;
  /** A leading status dot. */
  dot?: boolean;
  tone?: Tone;
}

export function Badge({ variant = "neutral", dot = false, tone, className, children, ...props }: BadgeProps) {
  return (
    <span {...props} className={cx("mk-badge", className)} data-variant={variant} data-tone={tone}>
      {dot && <span className="mk-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
