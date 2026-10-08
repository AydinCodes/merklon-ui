import type { ComponentPropsWithRef } from "react";
import { cx } from "../lib/cx";

export function Kbd({ className, ...props }: ComponentPropsWithRef<"kbd">) {
  return <kbd {...props} className={cx("mk-kbd", className)} />;
}
