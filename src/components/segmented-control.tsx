"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cx } from "../lib/cx";
import type { Tone } from "../lib/types";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Required when the label is only an icon. */
  ariaLabel?: string;
}

export interface SegmentedControlProps<T extends string>
  extends Omit<ComponentPropsWithRef<"div">, "onChange" | "defaultValue"> {
  options: SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  size?: "sm" | "md";
  tone?: Tone;
  name?: string;
}

/** One-of-a-few choice. Native radios, so arrow keys and forms just work. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  size = "md",
  tone,
  name,
  className,
  ...props
}: SegmentedControlProps<T>) {
  const generated = useId();
  const group = name ?? generated;
  return (
    <div {...props} role="radiogroup" className={cx("mk-segmented", className)} data-size={size} data-tone={tone}>
      {options.map((option) => (
        <label key={option.value} className="mk-segmented-item">
          <input
            type="radio"
            name={group}
            value={option.value}
            checked={value === option.value}
            onChange={() => onValueChange(option.value)}
            aria-label={option.ariaLabel}
            className="mk-segmented-input"
          />
          <span className="mk-segmented-label">{option.label}</span>
        </label>
      ))}
    </div>
  );
}
