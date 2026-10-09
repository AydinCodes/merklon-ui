"use client";

import {
  Children,
  createContext,
  isValidElement,
  use,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "../lib/cx";
import { place, trackAnchor } from "../lib/position";
import { composeRefs } from "../lib/slot";
import type { Tone } from "../lib/types";
import { useControllable } from "../lib/use-controllable";
import { useFieldControl, type FieldStatus } from "./field";
import type { ControlSize } from "./input";

interface SelectContextValue {
  value: string | undefined;
  choose: (value: string, item: HTMLElement) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

const options = (list: HTMLElement) =>
  Array.from(list.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])'));

/** Finds the label of the item with this value, so the trigger can show it. */
function findLabel(children: ReactNode, value: string | undefined): ReactNode {
  if (value === undefined) return null;
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ value?: string; children?: ReactNode }>(child)) continue;
    if (child.type === SelectItem && child.props.value === value) return child.props.children;
    const nested = findLabel(child.props.children, value);
    if (nested !== null) return nested;
  }
  return null;
}

export interface SelectProps
  extends Omit<ComponentPropsWithRef<"button">, "value" | "defaultValue" | "onChange" | "children"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: ReactNode;
  /** Submits the value under this name, like a native select. */
  name?: string;
  size?: ControlSize;
  status?: FieldStatus;
  tone?: Tone;
  children: ReactNode;
}

/**
 * A select with the Merklon menu surface. Opens instantly; the chosen option
 * blinks once. Arrow keys, Home/End and typeahead work, Esc closes and keeps
 * focus here. Tapping outside before choosing closes it and releases focus,
 * so the field does not stay highlighted.
 */
export function Select({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select…",
  name,
  size = "md",
  status,
  tone,
  className,
  children,
  ref,
  ...props
}: SelectProps) {
  const [current, setCurrent] = useControllable<string | undefined>({
    value,
    defaultValue,
    onChange: (next) => next !== undefined && onValueChange?.(next),
  });
  const field = useFieldControl(props, status);
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  // Why the list last closed: decides where focus goes afterwards.
  const closeReason = useRef<"select" | "keyboard" | null>(null);
  const wasOpen = useRef(false);
  const typeahead = useRef({ text: "", at: 0 });
  const [expanded, setExpanded] = useState(false);
  const untrack = useRef<(() => void) | null>(null);

  const isOpen = () => Boolean(listRef.current?.matches(":popover-open"));

  const open = (focus: "selected" | "first" | "last") => {
    const list = listRef.current;
    const trigger = triggerRef.current;
    if (!list || !trigger || isOpen()) return;
    list.removeAttribute("data-closing");
    closeReason.current = null;
    (list.showPopover as (options?: { source?: HTMLElement }) => void)({ source: trigger });
    list.style.minWidth = `${trigger.offsetWidth}px`;
    place(trigger, list, { side: "bottom", align: "start", offset: 6 });
    untrack.current = trackAnchor(trigger, list, { side: "bottom", align: "start", offset: 6 });
    setExpanded(true);
    const all = options(list);
    const selected = all.find((o) => o.getAttribute("aria-selected") === "true");
    const target = focus === "last" ? all[all.length - 1] : focus === "first" ? all[0] : selected ?? all[0];
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "nearest" });
  };

  const close = (reason: "select" | "keyboard") => {
    closeReason.current = reason;
    listRef.current?.hidePopover();
  };

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const onToggle = (event: Event) => {
      if ((event as ToggleEvent).newState !== "closed") return;
      untrack.current?.();
      untrack.current = null;
      const trigger = triggerRef.current;
      setExpanded(false);
      if (closeReason.current) {
        trigger?.focus({ preventScroll: true });
      } else {
        // Dismissed by a tap or click elsewhere: let go of focus entirely.
        requestAnimationFrame(() => {
          if (document.activeElement === trigger || list.contains(document.activeElement)) {
            (document.activeElement as HTMLElement | null)?.blur();
          }
        });
      }
      closeReason.current = null;
    };
    list.addEventListener("toggle", onToggle);
    return () => {
      list.removeEventListener("toggle", onToggle);
      untrack.current?.();
    };
  }, []);

  const choose = (next: string, item: HTMLElement) => {
    const list = listRef.current;
    if (!list || list.hasAttribute("data-closing")) return;
    setCurrent(next);
    list.setAttribute("data-closing", "");
    item.setAttribute("data-flash", "");
    const slowmo = Number(getComputedStyle(item).getPropertyValue("--mk-slowmo")) || 1;
    window.setTimeout(() => {
      item.removeAttribute("data-flash");
      close("select");
    }, 130 * slowmo);
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const all = options(event.currentTarget);
    const index = all.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number) => {
      const item = all[(i + all.length) % all.length];
      item?.focus({ preventScroll: true });
      item?.scrollIntoView({ block: "nearest" });
    };
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
      case "Escape":
      case "Tab":
        event.preventDefault();
        return close("keyboard");
      case "Enter":
      case " ": {
        event.preventDefault();
        const item = all[index];
        if (item) choose(item.dataset.value!, item);
        return;
      }
    }
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const now = performance.now();
      const state = typeahead.current;
      state.text = now - state.at > 600 ? event.key.toLowerCase() : state.text + event.key.toLowerCase();
      state.at = now;
      // A new letter looks past the current item; more letters of the same
      // word keep it in the running ("aus" stays on Australia).
      const start = state.text.length > 1 ? Math.max(index, 0) : index + 1;
      const ordered = [...all.slice(start), ...all.slice(0, start)];
      const match = ordered.find((item) => item.textContent?.trim().toLowerCase().startsWith(state.text));
      match?.focus({ preventScroll: true });
      match?.scrollIntoView({ block: "nearest" });
    }
  };

  const label = findLabel(children, current);

  return (
    <SelectContext value={{ value: current, choose }}>
      <button
        {...props}
        {...field}
        ref={composeRefs(triggerRef, ref)}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={listId}
        className={cx("mk-input", "mk-select-trigger", className)}
        data-size={size}
        data-tone={tone}
        data-placeholder={label === null || undefined}
        onPointerDown={(event) => {
          // Light dismiss closes the list on this press; don't reopen on the click.
          wasOpen.current = isOpen();
          props.onPointerDown?.(event);
        }}
        onClick={(event) => {
          props.onClick?.(event);
          if (wasOpen.current) {
            wasOpen.current = false;
            return;
          }
          open("selected");
        }}
        onKeyDown={(event) => {
          props.onKeyDown?.(event);
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            open(current === undefined ? (event.key === "ArrowDown" ? "first" : "last") : "selected");
          }
        }}
      >
        <span className="mk-select-value">{label ?? placeholder}</span>
        <svg className="mk-select-chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M5 6.5 8 9.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {name && <input type="hidden" name={name} value={current ?? ""} />}
      <div
        ref={listRef}
        id={listId}
        popover="auto"
        role="listbox"
        tabIndex={-1}
        aria-labelledby={field.id}
        className="mk-menu mk-select-list"
        data-tone={tone}
        onKeyDown={onListKeyDown}
      >
        {children}
      </div>
    </SelectContext>
  );
}

export interface SelectItemProps extends Omit<ComponentPropsWithRef<"div">, "onSelect"> {
  value: string;
  disabled?: boolean;
  children: ReactNode;
}

export function SelectItem({ value, disabled, className, children, ...props }: SelectItemProps) {
  const context = use(SelectContext);
  if (!context) throw new Error("<SelectItem> must be inside <Select>.");
  const selected = context.value === value;

  return (
    <div
      {...props}
      role="option"
      tabIndex={-1}
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-value={value}
      className={cx("mk-menu-item", "mk-select-item", className)}
      onPointerMove={(event) => {
        if (!disabled && document.activeElement !== event.currentTarget) event.currentTarget.focus({ preventScroll: true });
      }}
      onClick={(event) => {
        if (!disabled) context.choose(value, event.currentTarget);
      }}
    >
      <span className="mk-menu-text">{children}</span>
      <svg className="mk-select-check" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="m3.5 8.25 3 3 6-6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function SelectLabel({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} role="presentation" className={cx("mk-menu-label", className)} />;
}

export function SelectSeparator({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} role="separator" className={cx("mk-menu-separator", className)} />;
}
