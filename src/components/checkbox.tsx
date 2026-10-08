"use client";

import { useEffect, useId, useRef, type ComponentPropsWithRef, type ReactNode } from "react";
import { cx } from "../lib/cx";
import type { Tone } from "../lib/types";

export interface CheckboxProps extends Omit<ComponentPropsWithRef<"input">, "type"> {
  /** Shows a dash: some, but not all, children are checked. */
  indeterminate?: boolean;
  /** Rendering a label makes the whole row the hit target. */
  label?: ReactNode;
  description?: ReactNode;
  tone?: Tone;
}

export function Checkbox({ indeterminate = false, label, description, tone, className, ref, id, ...props }: CheckboxProps) {
  const inner = useRef<HTMLInputElement>(null);
  const generated = useId();
  const inputId = id ?? generated;

  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const box = (
    <span className="mk-checkbox" data-tone={tone}>
      <input
        {...props}
        id={inputId}
        ref={(node) => {
          inner.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        type="checkbox"
        className="mk-checkbox-input"
        aria-describedby={description ? `${inputId}-description` : props["aria-describedby"]}
      />
      <svg className="mk-checkbox-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path className="mk-checkbox-check" d="M4 8.25 6.75 11 12 5.5" pathLength={1} />
        <path className="mk-checkbox-dash" d="M4.5 8h7" />
      </svg>
    </span>
  );

  if (!label) return <span className={className}>{box}</span>;

  return (
    <label className={cx("mk-choice", className)} htmlFor={inputId} data-disabled={props.disabled || undefined}>
      {box}
      <span className="mk-choice-text">
        <span className="mk-choice-label">{label}</span>
        {description && (
          <span className="mk-choice-description" id={`${inputId}-description`}>
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
