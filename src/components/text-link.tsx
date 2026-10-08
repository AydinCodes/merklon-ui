import type { ComponentPropsWithRef } from "react";
import { cx } from "../lib/cx";
import { Slot } from "../lib/slot";
import type { Tone } from "../lib/types";

export interface TextLinkProps extends ComponentPropsWithRef<"a"> {
  variant?: "accent" | "muted";
  tone?: Tone;
  /** Render a router link (Next's <Link>) with these styles. */
  asChild?: boolean;
}

const ExternalGlyph = () => (
  <svg className="mk-link-external" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M4 2.5h5.5V8M9.25 2.75 3 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function TextLink({ variant = "accent", tone, asChild, className, children, ...props }: TextLinkProps) {
  const external = props.target === "_blank";
  const shared = { className: cx("mk-link", className), "data-variant": variant, "data-tone": tone };

  if (asChild) return <Slot {...shared} {...props}>{children}</Slot>;

  return (
    <a {...props} {...shared} rel={external ? props.rel ?? "noopener noreferrer" : props.rel}>
      {children}
      {external && (
        <>
          <ExternalGlyph />
          <span className="mk-visually-hidden"> (opens in a new tab)</span>
        </>
      )}
    </a>
  );
}
