"use client";

import { useRef } from "react";
import { flushSync } from "react-dom";
import { cx } from "../lib/cx";
import { useHotkey } from "../lib/use-hotkey";
import { useTheme, type ThemePreference } from "../theme/use-theme";
import { Kbd } from "./kbd";
import { Tooltip } from "./tooltip";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

export interface ThemeSwitchProps {
  /** Key that toggles the theme from anywhere (ignored while typing). Pass null to disable. */
  hotkey?: string | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * One button for light and dark, for pages without a navbar.
 *
 * - The new theme spreads out from the button in a circle (View Transitions):
 *   a rare moment, so it is allowed a little drama. Reduced motion: a plain cut.
 * - If the choice matches the OS setting, it goes back to following the OS,
 *   so nobody ends up stuck on a forced theme.
 * - The icon is chosen in CSS from the same attributes ThemeScript sets, so
 *   it is right before hydration.
 */
export function ThemeSwitch({ hotkey = "d", size = "sm", className }: ThemeSwitchProps) {
  const { resolvedTheme, systemTheme, setTheme } = useTheme();
  const ref = useRef<HTMLButtonElement>(null);
  const isDark = resolvedTheme === "dark";

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    const value: ThemePreference = next === systemTheme ? "system" : next;
    const apply = () => flushSync(() => setTheme(value));

    const root = document.documentElement;
    const doc = document as ViewTransitionDocument;
    const reduce =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || root.getAttribute("data-motion") === "reduce";
    if (!doc.startViewTransition || reduce) return apply();

    // Spread from the button if it's on screen, else from the centre.
    const rect = ref.current?.getBoundingClientRect();
    const visible = rect && rect.bottom > 0 && rect.top < window.innerHeight;
    const x = visible ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = visible ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    root.style.setProperty("--mk-vt-x", `${x}px`);
    root.style.setProperty("--mk-vt-y", `${y}px`);
    root.style.setProperty("--mk-vt-r", `${radius}px`);
    root.setAttribute("data-theme-transition", "");
    doc.startViewTransition(apply).finished.finally(() => root.removeAttribute("data-theme-transition"));
  };

  useHotkey(hotkey ?? "", toggle, Boolean(hotkey));

  return (
    <Tooltip
      content={
        <>
          {isDark ? "Light mode" : "Dark mode"}
          {hotkey && <Kbd>{hotkey.toUpperCase()}</Kbd>}
        </>
      }
    >
      <button
        ref={ref}
        type="button"
        aria-label="Dark mode"
        aria-pressed={isDark}
        className={cx("mk-button", "mk-icon-button", "mk-theme-switch", className)}
        data-variant="ghost"
        data-size={size}
        onClick={toggle}
      >
        <svg className="mk-theme-sun" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <circle cx="8" cy="8" r="2.75" />
          <path d="M8 1.5v1.25M8 13.25v1.25M14.5 8h-1.25M2.75 8H1.5M12.6 3.4l-.9.9M4.3 11.7l-.9.9M12.6 12.6l-.9-.9M4.3 4.3l-.9-.9" />
        </svg>
        <svg className="mk-theme-moon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
          <path d="M13.25 9.6A5.5 5.5 0 0 1 6.4 2.75a5.5 5.5 0 1 0 6.85 6.85Z" />
        </svg>
      </button>
    </Tooltip>
  );
}
