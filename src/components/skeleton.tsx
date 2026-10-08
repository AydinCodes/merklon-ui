import type { ComponentPropsWithRef } from "react";
import { cx } from "../lib/cx";

export interface SkeletonProps extends ComponentPropsWithRef<"span"> {
  /** Match the content that will replace it, so nothing shifts on load. */
  width?: number | string;
  height?: number | string;
  shape?: "line" | "rect" | "circle";
}

/**
 * Decorative only. Put aria-busy="true" on the region being loaded so
 * assistive tech hears "loading" once, not once per bar.
 */
export function Skeleton({ width, height, shape = "line", className, style, ...props }: SkeletonProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={cx("mk-skeleton", className)}
      data-shape={shape}
      style={{ width, height, ...style }}
    />
  );
}
