"use client";

import {
  createContext,
  use,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type ComponentPropsWithRef,
} from "react";
import { cx } from "../lib/cx";

export type FieldStatus = "invalid" | "valid";

interface FieldContextValue {
  id: string;
  descriptionId: string;
  errorId: string;
  status?: FieldStatus;
  disabled?: boolean;
  required?: boolean;
  hasDescription: boolean;
  hasError: boolean;
  setHasDescription: (value: boolean) => void;
  setHasError: (value: boolean) => void;
}

const FieldContext = createContext<FieldContextValue | null>(null);

export interface FieldProps extends ComponentPropsWithRef<"div"> {
  status?: FieldStatus;
  disabled?: boolean;
  required?: boolean;
  /** Use a specific id for the control instead of a generated one. */
  controlId?: string;
}

/**
 * Wires a label, control, description and error together: ids, htmlFor,
 * aria-describedby and aria-invalid are all handled. Works with Input,
 * Textarea, Select, Slider — any control that calls useFieldControl.
 */
export function Field({ status, disabled, required, controlId, className, children, ...props }: FieldProps) {
  const generated = useId();
  const id = controlId ?? generated;
  const [hasDescription, setHasDescription] = useState(false);
  const [hasError, setHasError] = useState(false);

  const value = useMemo(
    () => ({
      id,
      descriptionId: `${id}-description`,
      errorId: `${id}-error`,
      status,
      disabled,
      required,
      hasDescription,
      hasError,
      setHasDescription,
      setHasError,
    }),
    [id, status, disabled, required, hasDescription, hasError]
  );

  return (
    <FieldContext value={value}>
      <div
        {...props}
        className={cx("mk-field", className)}
        data-status={status}
        data-disabled={disabled || undefined}
      >
        {children}
      </div>
    </FieldContext>
  );
}

export function useField() {
  return use(FieldContext);
}

/**
 * Props a form control should spread to join its surrounding Field.
 * Explicit props on the control always win.
 */
export function useFieldControl<P extends {
  id?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling";
}>(props: P, status?: FieldStatus) {
  const field = useField();
  const resolved = status ?? field?.status;
  const describedBy =
    [
      props["aria-describedby"],
      field?.hasDescription ? field.descriptionId : null,
      field?.hasError ? field.errorId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return {
    id: props.id ?? field?.id,
    disabled: props.disabled ?? field?.disabled,
    required: props.required ?? field?.required,
    "aria-describedby": describedBy,
    "aria-invalid": props["aria-invalid"] ?? (resolved === "invalid" ? true : undefined),
    "data-status": resolved,
  };
}

export interface LabelProps extends ComponentPropsWithRef<"label"> {
  /** Shows a quiet "Optional" hint. Required fields are the default, so they get no marker. */
  optional?: boolean;
}

export function Label({ optional, className, children, htmlFor, ...props }: LabelProps) {
  const field = useField();
  return (
    <label {...props} htmlFor={htmlFor ?? field?.id} className={cx("mk-label", className)}>
      {children}
      {optional && <span className="mk-label-optional">Optional</span>}
    </label>
  );
}

export function FieldDescription({ className, ...props }: ComponentPropsWithRef<"p">) {
  const field = useField();
  const register = field?.setHasDescription;
  useLayoutEffect(() => {
    register?.(true);
    return () => register?.(false);
  }, [register]);

  return <p {...props} id={field?.descriptionId} className={cx("mk-field-description", className)} />;
}

export function FieldError({ className, children, ...props }: ComponentPropsWithRef<"p">) {
  const field = useField();
  const register = field?.setHasError;
  const visible = Boolean(children);
  useLayoutEffect(() => {
    if (!visible) return;
    register?.(true);
    return () => register?.(false);
  }, [register, visible]);

  if (!visible) return null;

  return (
    <p {...props} id={field?.errorId} role="alert" className={cx("mk-field-error", className)}>
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.75v3.75M8 10.9v.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {children}
    </p>
  );
}
