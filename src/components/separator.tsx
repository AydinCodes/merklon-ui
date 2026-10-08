import type { ComponentPropsWithRef } from "react";
import { cx } from "../lib/cx";

export interface SeparatorProps extends ComponentPropsWithRef<"div"> {
  orientation?: "horizontal" | "vertical";
  /** Purely visual separators are hidden from assistive tech. */
  decorative?: boolean;
}

export function Separator({ orientation = "horizontal", decorative = true, className, ...props }: SeparatorProps) {
  return (
    <div
      {...props}
      className={cx("mk-separator", className)}
      data-orientation={orientation}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
    />
  );
}
