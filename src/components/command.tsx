"use client";

import {
  createContext,
  use,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "../lib/cx";
import type { Tone } from "../lib/types";

interface CommandContextValue {
  search: string;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  count: number;
}

const CommandContext = createContext<CommandContextValue | null>(null);

function useCommand(component: string) {
  const context = use(CommandContext);
  if (!context) throw new Error(`<${component}> must be inside <Command>.`);
  return context;
}

/**
 * How well an item matches: 4 label starts with the query, 3 a word in the
 * label does, 2 the label contains it, 1 a keyword contains it or the
 * label holds its letters in order (fuzzy). 0 is no match.
 */
export function commandScore(query: string, label: string, keywords: string[] = []) {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const l = label.toLowerCase();
  if (l.startsWith(q)) return 4;
  if (l.split(/\s+/).some((word) => word.startsWith(q))) return 3;
  if (l.includes(q)) return 2;
  if (keywords.some((k) => k.toLowerCase().includes(q))) return 1;
  let i = 0;
  for (const char of l) if (char === q[i]) i += 1;
  return i === q.length ? 1 : 0;
}

export interface CommandProps extends Omit<ComponentPropsWithRef<"div">, "onSelect"> {
  /** Accessible name for the search box. */
  label?: string;
  placeholder?: string;
  /** Wrap from the last item back to the first with the arrow keys. */
  loop?: boolean;
  tone?: Tone;
}

/**
 * A searchable list, keyboard-first (after cmdk). The highlight moves with no
 * animation at all: it is driven by the arrow keys, many times a minute.
 */
export function Command({
  label = "Search commands",
  placeholder = "Type a command or search…",
  loop = true,
  tone,
  autoFocus,
  className,
  children,
  ...props
}: CommandProps) {
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const items = () =>
    Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-command-item]:not([aria-disabled="true"])') ?? []);

  // After every render: keep the count fresh, and keep a valid item active.
  useLayoutEffect(() => {
    const all = items();
    if (all.length !== count) setCount(all.length);
    if (!all.some((item) => item.id === activeId)) setActiveId(all[0]?.id ?? null);
  });

  // A new query highlights the best match (first one wins a tie).
  useLayoutEffect(() => {
    const best = items().reduce<HTMLElement | null>(
      (top, item) => (!top || Number(item.dataset.score) > Number(top.dataset.score) ? item : top),
      null
    );
    setActiveId(best?.id ?? null);
    listRef.current?.scrollTo({ top: 0 });
    // items() reads the DOM; search is the only real input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Keep the active item in view by scrolling the list only. scrollIntoView
  // would also scroll the page, which is wrong for an inline Command.
  useEffect(() => {
    const list = listRef.current;
    const item = activeId ? document.getElementById(activeId) : null;
    if (!list || !item) return;
    const top = item.offsetTop;
    const bottom = top + item.offsetHeight;
    if (top < list.scrollTop + 6) list.scrollTop = top - 6;
    else if (bottom > list.scrollTop + list.clientHeight - 6) list.scrollTop = bottom - list.clientHeight + 6;
  }, [activeId]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const all = items();
    const index = all.findIndex((item) => item.id === activeId);
    const move = (next: number) => {
      const bounded = loop ? (next + all.length) % all.length : Math.min(Math.max(next, 0), all.length - 1);
      setActiveId(all[bounded]?.id ?? null);
    };

    if (event.key === "ArrowDown" || (event.ctrlKey && event.key === "n")) {
      event.preventDefault();
      move(index + 1);
    } else if (event.key === "ArrowUp" || (event.ctrlKey && event.key === "p")) {
      event.preventDefault();
      move(index - 1);
    } else if (event.key === "Enter" && activeId) {
      event.preventDefault();
      document.getElementById(activeId)?.click();
    }
  };

  return (
    <CommandContext value={{ search, activeId, setActiveId, count }}>
      <div {...props} className={cx("mk-command", className)} data-tone={tone}>
        <div className="mk-command-search">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.5" />
            <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            className="mk-command-input"
            role="combobox"
            aria-label={label}
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId ?? undefined}
            autoFocus={autoFocus}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={placeholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
        <div ref={listRef} id={listId} role="listbox" aria-label={label} className="mk-command-list">
          {children}
        </div>
      </div>
    </CommandContext>
  );
}

export interface CommandGroupProps extends ComponentPropsWithRef<"div"> {
  heading?: ReactNode;
}

export function CommandGroup({ heading, className, children, ...props }: CommandGroupProps) {
  const headingId = useId();
  return (
    <div {...props} role="group" aria-labelledby={heading ? headingId : undefined} className={cx("mk-command-group", className)}>
      {heading && (
        <div id={headingId} className="mk-command-heading" aria-hidden="true">
          {heading}
        </div>
      )}
      {children}
    </div>
  );
}

export interface CommandItemProps extends Omit<ComponentPropsWithRef<"div">, "onSelect"> {
  /** Text matched against the search. Defaults to the string children. */
  value?: string;
  keywords?: string[];
  onSelect?: (value: string) => void;
  disabled?: boolean;
  icon?: ReactNode;
  shortcut?: ReactNode;
}

export function CommandItem({ value, keywords = [], onSelect, disabled, icon, shortcut, className, children, ...props }: CommandItemProps) {
  const { search, activeId, setActiveId } = useCommand("CommandItem");
  const id = useId();
  const text = value ?? (typeof children === "string" ? children : "");

  const score = commandScore(search, text, keywords);
  if (score === 0) return null;

  return (
    <div
      {...props}
      id={id}
      role="option"
      data-command-item=""
      data-score={score}
      aria-selected={activeId === id}
      aria-disabled={disabled || undefined}
      className={cx("mk-command-item", className)}
      onPointerMove={() => {
        if (!disabled && activeId !== id) setActiveId(id);
      }}
      onClick={() => {
        if (!disabled) onSelect?.(text);
      }}
    >
      {icon && <span className="mk-menu-icon">{icon}</span>}
      <span className="mk-menu-text">{children}</span>
      {shortcut && <span className="mk-menu-shortcut">{shortcut}</span>}
    </div>
  );
}

export function CommandEmpty({ className, children = "No results.", ...props }: ComponentPropsWithRef<"div">) {
  const { count } = useCommand("CommandEmpty");
  if (count > 0) return null;
  return (
    <div {...props} role="status" className={cx("mk-command-empty", className)}>
      {children}
    </div>
  );
}

export function CommandSeparator({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} role="separator" className={cx("mk-menu-separator", className)} />;
}

export interface CommandDialogProps extends CommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rendered under the list, e.g. keyboard hints. */
  footer?: ReactNode;
}

/**
 * Command in a modal. Opens instantly, closes with a short fade. Bind the
 * shortcut yourself (useHotkey("mod+k", …)) — the menu does not guess.
 */
export function CommandDialog({ open, onOpenChange, footer, children, tone, ...props }: CommandDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  // Command only renders while open, so every opening starts with a fresh,
  // empty search.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLInputElement>(".mk-command-input")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="mk-command-dialog"
      aria-label={props.label ?? "Command menu"}
      data-tone={tone}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      {open && (
        <Command {...props}>
          {children}
        </Command>
      )}
      {open && footer && <div className="mk-command-footer">{footer}</div>}
    </dialog>
  );
}
