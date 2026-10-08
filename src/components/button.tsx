import type { ComponentPropsWithRef, MouseEvent } from "react";
import { cx } from "../lib/cx";
import { Slot } from "../lib/slot";
import type { Tone } from "../lib/types";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Keeps its width, swaps the label for a spinner, and ignores clicks. */
  loading?: boolean;
  tone?: Tone;
  /** Render the child element (e.g. a router Link) with button styling. */
  asChild?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  tone,
  asChild = false,
  className,
  children,
  onClick,
  type,
  ...props
}: ButtonProps) {
  const shared = {
    className: cx("mk-button", className),
    "data-variant": variant,
    "data-size": size,
    "data-tone": tone,
    "data-loading": loading || undefined,
    "aria-busy": loading || undefined,
    "aria-disabled": loading || props["aria-disabled"] || undefined,
  };

  if (asChild) {
    return (
      <Slot {...shared} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      {...props}
      {...shared}
      type={type ?? "button"}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        // Stays focusable while loading (so focus is not lost), but inert.
        if (loading) return event.preventDefault();
        onClick?.(event);
      }}
    >
      <span className="mk-button-label">{children}</span>
      {loading && <Spinner className="mk-button-spinner" size={size === "lg" ? 18 : 16} label={null} />}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonProps, "asChild" | "aria-label"> {
  /** Icon-only buttons have no text, so a label is required. */
  "aria-label": string;
}

export function IconButton({ variant = "ghost", className, ...props }: IconButtonProps) {
  return <Button {...props} variant={variant} className={cx("mk-icon-button", className)} />;
}
