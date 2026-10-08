"use client";

import type { ComponentPropsWithRef } from "react";
import { cx } from "../lib/cx";
import type { Tone } from "../lib/types";
import { useFieldControl, type FieldStatus } from "./field";
import type { ControlSize } from "./input";

export interface NativeSelectProps extends Omit<ComponentPropsWithRef<"select">, "size"> {
  size?: ControlSize;
  status?: FieldStatus;
  tone?: Tone;
}

/**
 * A styled native <select>. The phone's own picker, zero JS. Prefer Select
 * for the Merklon look; use this for very long lists (countries, years)
 * where the OS picker's search and scrolling are better.
 */
export function NativeSelect({ size = "md", status, tone, className, children, ...props }: NativeSelectProps) {
  const field = useFieldControl(props, status);
  return (
    <span className={cx("mk-select", className)} data-size={size} data-tone={tone}>
      <select {...props} {...field} className="mk-input mk-select-control" data-size={size}>
        {children}
      </select>
      <svg className="mk-select-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M5 6.5 8 9.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
