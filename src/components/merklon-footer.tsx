"use client";

import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { Button } from "./button";
import { MerklonMark } from "./merklon-mark";
import { ThemeSwitch } from "./theme-switch";
import { Tooltip } from "./tooltip";

export interface FooterSocial {
  label: string;
  href: string;
  icon: ReactNode;
}

const XIcon = (
  <svg viewBox="0 0 300 271" fill="currentColor" aria-hidden="true">
    <path d="m236 0h46l-101 115 118 156h-92.6l-72.5-94.8-83 94.8h-46l107-123-113-148h94.9l65.5 86.6zm-16.1 244h25.5l-165-218h-27.4z" />
  </svg>
);

const InstagramIcon = (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <rect x="1.75" y="1.75" width="12.5" height="12.5" rx="3.75" />
    <circle cx="8" cy="8" r="3" />
    <circle cx="11.9" cy="4.1" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

export const MERKLON_SOCIALS: FooterSocial[] = [
  { label: "X", href: "https://x.com/merklon_", icon: XIcon },
  { label: "Instagram", href: "https://www.instagram.com/merklon_", icon: InstagramIcon },
];

export interface MerklonFooterProps {
  /** Where the mark links. Other sites: the Merklon hub. */
  homeHref?: string;
  /** Every site links to the one shared contact page. */
  contactHref?: string;
  socials?: FooterSocial[];
  /** The light/dark switch (with the D shortcut). On by default. */
  themeSwitch?: boolean;
  className?: string;
}

/**
 * The footer every Merklon site shares: the mark home, Contact, socials and
 * the theme switch. Nothing else — a site's own links belong in the site.
 */
export function MerklonFooter({
  homeHref = "https://merklon.com",
  contactHref = "https://merklon.com/contact",
  socials = MERKLON_SOCIALS,
  themeSwitch = true,
  className,
}: MerklonFooterProps) {
  return (
    <footer className={cx("mk-footer", className)}>
      <div className="mk-footer-row">
        <a className="mk-footer-brand" href={homeHref} aria-label="Merklon, home">
          <MerklonMark size={16} />
          <span aria-hidden="true">Merklon</span>
        </a>
        <nav className="mk-footer-links" aria-label="Footer">
          <a className="mk-footer-link" href={contactHref}>
            Contact
          </a>
          {socials.map((social) => (
            <Tooltip key={social.href} content={social.label}>
              <Button asChild variant="ghost" size="sm" className="mk-icon-button mk-footer-icon">
                <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={`Merklon on ${social.label} (opens in a new tab)`}>
                  {social.icon}
                </a>
              </Button>
            </Tooltip>
          ))}
          {themeSwitch && (
            <>
              <span className="mk-footer-divider" aria-hidden="true" />
              <ThemeSwitch />
            </>
          )}
        </nav>
      </div>
    </footer>
  );
}
