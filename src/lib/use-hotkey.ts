"use client";

import { useEffect, useRef } from "react";

/**
 * Binds a shortcut such as "mod+k" (⌘ on Apple platforms, Ctrl elsewhere),
 * "shift+/" or "escape". Ignores key presses while typing in a field unless
 * the combo uses a modifier.
 */
export function useHotkey(combo: string, handler: (event: KeyboardEvent) => void, enabled = true) {
  const saved = useRef(handler);
  useEffect(() => {
    saved.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const parts = combo.toLowerCase().split("+");
    const key = parts.pop()!;
    const wantMod = parts.includes("mod");
    const wantShift = parts.includes("shift");
    const wantAlt = parts.includes("alt");

    const onKeyDown = (event: KeyboardEvent) => {
      const isApple = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);
      const mod = isApple ? event.metaKey : event.ctrlKey;
      if (wantMod !== mod || wantShift !== event.shiftKey || wantAlt !== event.altKey) return;
      if (event.key.toLowerCase() !== key) return;

      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable='true']");
      if (typing && !wantMod) return;

      event.preventDefault();
      saved.current(event);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [combo, enabled]);
}

/** "⌘" on Apple platforms, "Ctrl" elsewhere. Call only on the client. */
export function modKeyLabel() {
  return /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl";
}
