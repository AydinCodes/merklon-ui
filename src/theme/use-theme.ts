"use client";

import { useCallback, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "./theme-script";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const CHANGE_EVENT = "mk-theme-change";
const darkQuery = "(prefers-color-scheme: dark)";

function readPreference(storageKey: string): ThemePreference {
  try {
    const value = localStorage.getItem(storageKey);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(darkQuery);
  media.addEventListener("change", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Flipping every token at once would otherwise kick off hundreds of colour
 * transitions — the whole page smearing into the new theme. A theme switch
 * should be a cut, so transitions are suspended for exactly one frame.
 */
function withoutTransitions(apply: () => void) {
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(style);
  apply();
  // Force a style flush before re-enabling transitions.
  void window.getComputedStyle(document.body).opacity;
  requestAnimationFrame(() => style.remove());
}

/**
 * The visitor's theme preference, its resolved value, and a setter.
 * Works with ThemeScript: both read and write the same storage key.
 */
export function useTheme(storageKey: string = THEME_STORAGE_KEY) {
  const theme = useSyncExternalStore<ThemePreference>(
    subscribe,
    () => readPreference(storageKey),
    () => "system"
  );

  const systemDark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(darkQuery).matches,
    () => false
  );

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  const setTheme = useCallback(
    (next: ThemePreference) => {
      withoutTransitions(() => {
        const root = document.documentElement;
        try {
          if (next === "system") localStorage.removeItem(storageKey);
          else localStorage.setItem(storageKey, next);
        } catch {
          // Private mode or blocked storage: still apply for this visit.
        }
        if (next === "system") root.removeAttribute("data-theme");
        else root.setAttribute("data-theme", next);
      });
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [storageKey]
  );

  return { theme, resolvedTheme, setTheme };
}
