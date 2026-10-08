"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cx } from "../lib/cx";
import type { Tone } from "../lib/types";
import { useControllable } from "../lib/use-controllable";

export interface SwitchProps extends Omit<ComponentPropsWithRef<"button">, "onChange" | "value"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Rendering a label makes the whole row the hit target. */
  label?: ReactNode;
  description?: ReactNode;
  /** Submits "on" under this name when checked, like a native checkbox. */
  name?: string;
  size?: "sm" | "md";
  tone?: Tone;
}

/**
 * A switch applies immediately — it is a setting, not a form answer. If the
 * change needs a Save button, use a Checkbox instead.
 */
export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  description,
  name,
  size = "md",
  tone,
  className,
  id,
  disabled,
  ...props
}: SwitchProps) {
  const [on, setOn] = useControllable({ value: checked, defaultValue: defaultChecked, onChange: onCheckedChange });
  const generated = useId();
  const switchId = id ?? generated;

  const control = (
    <button
      {...props}
      id={switchId}
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      aria-describedby={description ? `${switchId}-description` : props["aria-describedby"]}
      className={cx("mk-switch", !label && className)}
      data-state={on ? "checked" : "unchecked"}
      data-size={size}
      data-tone={tone}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) setOn(!on);
      }}
    >
      <span className="mk-switch-thumb" />
      {name && <input type="hidden" name={name} value={on ? "on" : ""} disabled={!on} />}
    </button>
  );

  if (!label) return control;

  return (
    <span className={cx("mk-choice", "mk-switch-row", className)} data-disabled={disabled || undefined}>
      <span className="mk-choice-text">
        <label className="mk-choice-label" htmlFor={switchId}>
          {label}
        </label>
        {description && (
          <span className="mk-choice-description" id={`${switchId}-description`}>
            {description}
          </span>
        )}
      </span>
      {control}
    </span>
  );
}
