"use client";

import type { ComponentPropsWithRef } from "react";
import { cx } from "../lib/cx";
import type { Tone } from "../lib/types";
import { useFieldControl, type FieldStatus } from "./field";

export type ControlSize = "sm" | "md" | "lg";

export interface InputProps extends Omit<ComponentPropsWithRef<"input">, "size"> {
  size?: ControlSize;
  status?: FieldStatus;
  tone?: Tone;
}

export function Input({ size = "md", status, tone, className, ...props }: InputProps) {
  const field = useFieldControl(props, status);
  return (
    <input
      {...props}
      {...field}
      className={cx("mk-input", className)}
      data-size={size}
      data-tone={tone}
    />
  );
}

export interface TextareaProps extends ComponentPropsWithRef<"textarea"> {
  status?: FieldStatus;
  tone?: Tone;
  /** Grow with content (CSS field-sizing) between rows and maxRows. */
  autoGrow?: boolean;
  maxRows?: number;
}

export function Textarea({ status, tone, autoGrow = true, maxRows = 10, rows = 3, className, style, ...props }: TextareaProps) {
  const field = useFieldControl(props, status);
  return (
    <textarea
      {...props}
      {...field}
      rows={rows}
      className={cx("mk-input", "mk-textarea", className)}
      data-autogrow={autoGrow || undefined}
      data-tone={tone}
      style={{ ["--_rows" as string]: rows, ["--_max-rows" as string]: maxRows, ...style }}
    />
  );
}
