"use client";

import { useRef, type ComponentPropsWithRef, type CSSProperties } from "react";
import { cx } from "../lib/cx";
import type { Tone } from "../lib/types";
import { useFieldControl, type FieldStatus } from "./field";

export interface SliderProps
  extends Omit<ComponentPropsWithRef<"input">, "type" | "value" | "defaultValue" | "onChange"> {
  value?: number;
  defaultValue?: number;
  /** Fires on every movement. Kept cheap: the fill is painted from a CSS variable, not React state. */
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  status?: FieldStatus;
  tone?: Tone;
}

function percent(value: number, min: number, max: number) {
  return max === min ? 0 : ((value - min) / (max - min)) * 100;
}

/**
 * A native range input, so arrow keys, Page Up/Down, Home/End and screen
 * readers all work. The thumb tracks the pointer 1:1 — nothing animates
 * while you drag; only the thumb's press state does.
 */
export function Slider({
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  status,
  tone,
  className,
  style,
  ref,
  ...props
}: SliderProps) {
  const field = useFieldControl(props, status);
  const inner = useRef<HTMLInputElement | null>(null);
  const initial = value ?? defaultValue ?? min;

  return (
    <input
      {...props}
      {...field}
      ref={(node) => {
        inner.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      defaultValue={value === undefined ? defaultValue : undefined}
      className={cx("mk-slider", className)}
      data-tone={tone}
      style={{ "--_pct": `${percent(initial, min, max)}%`, ...style } as CSSProperties}
      onChange={(event) => {
        const next = Number(event.currentTarget.value);
        // Write the fill straight to the DOM: a drag is a high-frequency
        // event and should not wait on a render.
        event.currentTarget.style.setProperty("--_pct", `${percent(next, min, max)}%`);
        onValueChange?.(next);
      }}
    />
  );
}
