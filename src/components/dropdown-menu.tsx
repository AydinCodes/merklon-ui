"use client";

import {
  createContext,
  use,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { cx } from "../lib/cx";
import { place, trackAnchor, type Align, type Side } from "../lib/position";
import { Slot } from "../lib/slot";
import type { Tone } from "../lib/types";

interface MenuContextValue {
  contentId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  side: Side;
  align: Align;
  show: (focus: "first" | "last" | "menu") => void;
  hide: (returnFocus: boolean) => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenu(component: string) {
  const context = use(MenuContext);
  if (!context) throw new Error(`<${component}> must be inside <DropdownMenu>.`);
  return context;
}

const enabledItems = (menu: HTMLElement) =>
  Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'));

export interface DropdownMenuProps {
  children: ReactNode;
  side?: Side;
  align?: Align;
  onOpenChange?: (open: boolean) => void;
}

/**
 * A menu of actions. It opens instantly — menus are used constantly, and an
 * entrance animation would be paid on every use — and confirms the chosen
 * item with a brief blink before fading out, like a native menu.
 */
export function DropdownMenu({ children, side = "bottom", align = "start", onOpenChange }: DropdownMenuProps) {
  const contentId = useId();
  const [open, setOpenState] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const untrack = useRef<(() => void) | null>(null);

  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
    if (!next) {
      untrack.current?.();
      untrack.current = null;
    }
  };

  const show = (focus: "first" | "last" | "menu") => {
    const menu = contentRef.current;
    const trigger = triggerRef.current;
    if (!menu || !trigger || menu.matches(":popover-open")) return;
    menu.removeAttribute("data-closing");
    // `source` ties the popover to its trigger where supported (focus return,
    // and clicking the trigger again does not count as an outside click).
    (menu.showPopover as (options?: { source?: HTMLElement }) => void)({ source: trigger });
    menu.style.minWidth = `${trigger.offsetWidth}px`;
    place(trigger, menu, { side, align, offset: 6 });
    untrack.current = trackAnchor(trigger, menu, { side, align, offset: 6 });
    const items = enabledItems(menu);
    if (focus === "first") items[0]?.focus();
    else if (focus === "last") items[items.length - 1]?.focus();
    else menu.focus();
  };

  const hide = (returnFocus: boolean) => {
    const menu = contentRef.current;
    if (!menu?.matches(":popover-open")) return;
    menu.hidePopover();
    if (returnFocus) triggerRef.current?.focus();
  };

  return (
    <MenuContext value={{ contentId, open, setOpen, triggerRef, contentRef, side, align, show, hide }}>
      {children}
    </MenuContext>
  );
}

export function DropdownMenuTrigger({ children }: { children: ReactElement }) {
  const { contentId, open, triggerRef, show, contentRef } = useMenu("DropdownMenuTrigger");
  const wasOpen = useRef(false);

  return (
    <Slot
      ref={triggerRef}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={contentId}
      onPointerDown={() => {
        // Light dismiss closes the menu on this press; remember, so the
        // click that follows does not immediately re-open it.
        wasOpen.current = Boolean(contentRef.current?.matches(":popover-open"));
      }}
      onClick={(event: { detail: number }) => {
        if (wasOpen.current) {
          wasOpen.current = false;
          return;
        }
        // detail === 0: activated from the keyboard, so put focus on an item.
        show(event.detail === 0 ? "first" : "menu");
      }}
      onKeyDown={(event: KeyboardEvent) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          show(event.key === "ArrowDown" ? "first" : "last");
        }
      }}
    >
      {children}
    </Slot>
  );
}

export interface DropdownMenuContentProps extends ComponentPropsWithRef<"div"> {
  tone?: Tone;
}

export function DropdownMenuContent({ tone, className, children, ...props }: DropdownMenuContentProps) {
  const { contentId, contentRef, setOpen, hide } = useMenu("DropdownMenuContent");
  const typeahead = useRef({ text: "", at: 0 });

  useEffect(() => {
    const menu = contentRef.current;
    if (!menu) return;
    const onToggle = (event: Event) => setOpen((event as ToggleEvent).newState === "open");
    menu.addEventListener("toggle", onToggle);
    return () => menu.removeEventListener("toggle", onToggle);
    // setOpen is stable in practice; re-binding would miss events mid-toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentRef]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const menu = event.currentTarget;
    const items = enabledItems(menu);
    const index = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number) => items[(i + items.length) % items.length]?.focus();

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        return focusAt(index + 1);
      case "ArrowUp":
        event.preventDefault();
        return focusAt(index < 0 ? -1 : index - 1);
      case "Home":
        event.preventDefault();
        return focusAt(0);
      case "End":
        event.preventDefault();
        return focusAt(-1);
      case "Tab":
        event.preventDefault();
        return hide(true);
    }

    // Typeahead: type the start of an item's label to jump to it.
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const now = performance.now();
      const state = typeahead.current;
      state.text = now - state.at > 600 ? event.key.toLowerCase() : state.text + event.key.toLowerCase();
      state.at = now;
      // A new letter looks past the current item; more letters of the same
      // word keep it in the running.
      const start = state.text.length > 1 ? Math.max(index, 0) : index + 1;
      const ordered = [...items.slice(start), ...items.slice(0, start)];
      ordered.find((item) => item.textContent?.trim().toLowerCase().startsWith(state.text))?.focus();
    }
  };

  return (
    <div
      {...props}
      ref={contentRef}
      id={contentId}
      popover="auto"
      role="menu"
      tabIndex={-1}
      className={cx("mk-menu", className)}
      data-tone={tone}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}

export interface DropdownMenuItemProps extends Omit<ComponentPropsWithRef<"button">, "onSelect"> {
  onSelect?: () => void;
  variant?: "default" | "destructive";
  icon?: ReactNode;
  shortcut?: ReactNode;
}

export function DropdownMenuItem({ onSelect, variant = "default", icon, shortcut, disabled, className, children, ...props }: DropdownMenuItemProps) {
  const { hide, contentRef } = useMenu("DropdownMenuItem");

  return (
    <button
      {...props}
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      className={cx("mk-menu-item", className)}
      data-variant={variant}
      // Highlight follows the pointer with no transition: menus are fast-moving.
      onPointerMove={(event) => {
        if (!disabled && document.activeElement !== event.currentTarget) event.currentTarget.focus();
      }}
      onPointerLeave={() => contentRef.current?.focus()}
      onClick={(event) => {
        const menu = contentRef.current;
        if (disabled || !menu || menu.hasAttribute("data-closing")) return;
        props.onClick?.(event);
        // Act now; the blink is acknowledgement, not a wait.
        onSelect?.();
        menu.setAttribute("data-closing", "");
        event.currentTarget.setAttribute("data-flash", "");
        const item = event.currentTarget;
        const slowmo = Number(getComputedStyle(item).getPropertyValue("--mk-slowmo")) || 1;
        window.setTimeout(() => {
          item.removeAttribute("data-flash");
          hide(true);
        }, 130 * slowmo);
      }}
    >
      {icon && <span className="mk-menu-icon">{icon}</span>}
      <span className="mk-menu-text">{children}</span>
      {shortcut && <span className="mk-menu-shortcut">{shortcut}</span>}
    </button>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} role="presentation" className={cx("mk-menu-label", className)} />;
}

export function DropdownMenuSeparator({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} role="separator" className={cx("mk-menu-separator", className)} />;
}
