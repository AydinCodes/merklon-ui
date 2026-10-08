import type { ComponentPropsWithRef } from "react";
import { cx } from "../lib/cx";
import { Slot } from "../lib/slot";
import type { Tone } from "../lib/types";

export interface CardProps extends ComponentPropsWithRef<"div"> {
  /** "raised" adds a soft shadow; "flat" is border only. */
  variant?: "flat" | "raised";
  /**
   * Hover and focus feedback for a card that is itself a link. Pair with
   * asChild and an <a>, so the whole card is one target.
   */
  interactive?: boolean;
  asChild?: boolean;
  tone?: Tone;
}

export function Card({ variant = "flat", interactive, asChild, tone, className, ...props }: CardProps) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      {...props}
      className={cx("mk-card", className)}
      data-variant={variant}
      data-interactive={interactive || undefined}
      data-tone={tone}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx("mk-card-header", className)} />;
}

export function CardTitle({ className, ...props }: ComponentPropsWithRef<"h3">) {
  return <h3 {...props} className={cx("mk-card-title", className)} />;
}

export function CardDescription({ className, ...props }: ComponentPropsWithRef<"p">) {
  return <p {...props} className={cx("mk-card-description", className)} />;
}

export function CardContent({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx("mk-card-content", className)} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx("mk-card-footer", className)} />;
}
