"use client";

import { createContext, use, useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cx } from "../lib/cx";
import type { Tone } from "../lib/types";
import { useControllable } from "../lib/use-controllable";

interface RadioGroupContextValue {
  name: string;
  value: string | undefined;
  setValue: (value: string | undefined) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends Omit<ComponentPropsWithRef<"div">, "onChange" | "defaultValue"> {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal";
  tone?: Tone;
}

/**
 * Native radios underneath, so arrow keys, form submission and screen
 * readers behave exactly as the platform does. Label the group with
 * aria-label or aria-labelledby.
 */
export function RadioGroup({
  name,
  value,
  defaultValue,
  onValueChange,
  disabled,
  orientation = "vertical",
  tone,
  className,
  children,
  ...props
}: RadioGroupProps) {
  const generated = useId();
  const [current, setCurrent] = useControllable<string | undefined>({
    value,
    defaultValue,
    onChange: (next) => next !== undefined && onValueChange?.(next),
  });

  return (
    <RadioGroupContext value={{ name: name ?? generated, value: current, setValue: setCurrent, disabled }}>
      <div
        {...props}
        role="radiogroup"
        aria-disabled={disabled || undefined}
        aria-orientation={orientation}
        className={cx("mk-radio-group", className)}
        data-orientation={orientation}
        data-tone={tone}
      >
        {children}
      </div>
    </RadioGroupContext>
  );
}

export interface RadioProps extends Omit<ComponentPropsWithRef<"input">, "type" | "value"> {
  value: string;
  label?: ReactNode;
  description?: ReactNode;
}

export function Radio({ value, label, description, className, id, disabled, ...props }: RadioProps) {
  const group = use(RadioGroupContext);
  const generated = useId();
  const inputId = id ?? generated;
  const isDisabled = disabled ?? group?.disabled;

  const input = (
    <span className="mk-radio">
      <input
        {...props}
        id={inputId}
        type="radio"
        className="mk-radio-input"
        name={group?.name ?? props.name}
        value={value}
        disabled={isDisabled}
        checked={group ? group.value === value : props.checked}
        onChange={(event) => {
          props.onChange?.(event);
          if (event.target.checked) group?.setValue(value);
        }}
        aria-describedby={description ? `${inputId}-description` : props["aria-describedby"]}
      />
    </span>
  );

  if (!label) return input;

  return (
    <label className={cx("mk-choice", className)} htmlFor={inputId} data-disabled={isDisabled || undefined}>
      {input}
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
