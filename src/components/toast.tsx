"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cx } from "../lib/cx";
import { Spinner } from "./spinner";

/* ---------------------------------------------------------------------------
   Store — module-level, so toast() can be called from anywhere, even outside
   React. <Toaster /> renders whatever is in it.
   --------------------------------------------------------------------------- */

export type ToastType = "default" | "success" | "error" | "loading";

export interface ToastOptions {
  description?: ReactNode;
  /** Milliseconds on screen. Loading toasts stay until updated. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastRecord extends ToastOptions {
  id: number;
  title: ReactNode;
  type: ToastType;
  leaving?: boolean;
  /** Bumps when a toast is updated in place, restarting its timer. */
  version: number;
}

let records: ToastRecord[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function exitDuration() {
  // Read where the toasts live: slow-mo can be set on any ancestor.
  const host = document.querySelector(".mk-toaster") ?? document.documentElement;
  const slowmo = Number(getComputedStyle(host).getPropertyValue("--mk-slowmo")) || 1;
  return 200 * slowmo;
}

function add(title: ReactNode, type: ToastType, options: ToastOptions = {}) {
  const id = nextId++;
  records = [...records, { id, title, type, version: 0, ...options }];
  emit();
  return id;
}

function update(id: number, title: ReactNode, type: ToastType, options: ToastOptions = {}) {
  records = records.map((r) => (r.id === id ? { ...r, ...options, title, type, version: r.version + 1 } : r));
  emit();
}

function dismiss(id?: number) {
  const targets = records.filter((r) => (id === undefined || r.id === id) && !r.leaving);
  if (!targets.length) return;
  records = records.map((r) => (targets.includes(r) ? { ...r, leaving: true } : r));
  emit();
  // Keep it mounted for its exit fade, then drop it.
  window.setTimeout(() => {
    records = records.filter((r) => !targets.some((t) => t.id === r.id));
    emit();
  }, exitDuration());
}

export const toast = Object.assign((title: ReactNode, options?: ToastOptions) => add(title, "default", options), {
  success: (title: ReactNode, options?: ToastOptions) => add(title, "success", options),
  error: (title: ReactNode, options?: ToastOptions) => add(title, "error", options),
  loading: (title: ReactNode, options?: ToastOptions) => add(title, "loading", options),
  /** One toast that follows a promise from loading to success or error. */
  promise<T>(
    promise: Promise<T>,
    messages: { loading: ReactNode; success: ReactNode | ((value: T) => ReactNode); error: ReactNode | ((error: unknown) => ReactNode) }
  ) {
    const id = add(messages.loading, "loading");
    promise.then(
      (value) => update(id, typeof messages.success === "function" ? (messages.success as (v: T) => ReactNode)(value) : messages.success, "success"),
      (error) => update(id, typeof messages.error === "function" ? (messages.error as (e: unknown) => ReactNode)(error) : messages.error, "error")
    );
    return promise;
  },
  dismiss,
});

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => records;
const EMPTY: ToastRecord[] = [];
const getServerSnapshot = () => EMPTY;

/* ---------------------------------------------------------------------------
   Toaster — render once, near the root.
   --------------------------------------------------------------------------- */

const VISIBLE = 3;
const GAP = 10;
const PEEK = 12;
const DEFAULT_DURATION: Record<ToastType, number> = { default: 4000, success: 4000, error: 6000, loading: Infinity };

export interface ToasterProps {
  position?: "bottom-right" | "bottom-center" | "top-center";
  className?: string;
}

export function Toaster({ position = "bottom-right", className }: ToasterProps) {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [heights, setHeights] = useState<Record<number, number>>({});
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const expanded = hovered || focused;

  // Newest first: index 0 is the front of the stack.
  const ordered = [...list].reverse();
  const live = ordered.filter((r) => !r.leaving);
  const frontHeight = heights[live[0]?.id] ?? 0;

  useEffect(() => {
    if (list.length === 0) {
      setHovered(false);
      setFocused(false);
    }
  }, [list.length]);

  return (
    <section aria-label="Notifications" className={cx("mk-toaster", className)} data-position={position}>
      <ol
        aria-live="polite"
        aria-relevant="additions text"
        className="mk-toaster-list"
        data-expanded={expanded || undefined}
        style={{ "--_front-height": `${frontHeight}px` } as CSSProperties}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
        }}
      >
        {ordered.map((record) => {
          const index = live.indexOf(record);
          const offset = live.slice(0, Math.max(index, 0)).reduce((sum, r) => sum + (heights[r.id] ?? 0) + GAP, 0);
          return (
            <ToastItem
              key={record.id}
              record={record}
              index={index}
              offset={offset}
              expanded={expanded}
              paused={expanded}
              onHeight={(h) => setHeights((prev) => (prev[record.id] === h ? prev : { ...prev, [record.id]: h }))}
            />
          );
        })}
      </ol>
    </section>
  );
}

function ToastItem({
  record,
  index,
  offset,
  expanded,
  paused,
  onHeight,
}: {
  record: ToastRecord;
  index: number;
  offset: number;
  expanded: boolean;
  paused: boolean;
  onHeight: (height: number) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const drag = useRef<{ x: number; t: number; dx: number } | null>(null);
  const [swiping, setSwiping] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => onHeight(el.querySelector<HTMLElement>(".mk-toast-body")?.offsetHeight ?? el.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el.querySelector(".mk-toast-body") ?? el);
    return () => observer.disconnect();
    // onHeight is recreated each render; re-measuring on content change is via ResizeObserver.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss, pausing while the stack is expanded (hovered or focused)
  // and while the tab is hidden. Remaining time carries over.
  const remaining = useRef(record.duration ?? DEFAULT_DURATION[record.type]);
  useEffect(() => {
    remaining.current = record.duration ?? DEFAULT_DURATION[record.type];
  }, [record.version, record.duration, record.type]);

  useEffect(() => {
    if (record.leaving || paused || !Number.isFinite(remaining.current)) return;
    let started = performance.now();
    let timer = window.setTimeout(() => dismiss(record.id), remaining.current);
    const onVisibility = () => {
      if (document.hidden) {
        window.clearTimeout(timer);
        remaining.current -= performance.now() - started;
      } else {
        started = performance.now();
        timer = window.setTimeout(() => dismiss(record.id), remaining.current);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      if (!document.hidden) remaining.current -= performance.now() - started;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [paused, record.id, record.leaving, record.version]);

  const onPointerDown = (event: ReactPointerEvent<HTMLLIElement>) => {
    if ((event.target as HTMLElement).closest("button, a")) return;
    drag.current = { x: event.clientX, t: performance.now(), dx: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLLIElement>) => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    // Hysteresis: a few pixels of slop before it counts as a swipe.
    if (!swiping && Math.abs(dx) < 6) return;
    if (!swiping) setSwiping(true);
    drag.current.dx = dx;
    // 1:1 tracking, written straight to the DOM.
    event.currentTarget.style.setProperty("--_swipe", `${dx}px`);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLLIElement>) => {
    const state = drag.current;
    drag.current = null;
    if (!state || !swiping) return;
    setSwiping(false);
    const velocity = Math.abs(state.dx) / Math.max(performance.now() - state.t, 1);
    if (Math.abs(state.dx) > 80 || velocity > 0.6) {
      event.currentTarget.style.setProperty("--_swipe", `${Math.sign(state.dx) * 420}px`);
      dismiss(record.id);
    } else {
      event.currentTarget.style.setProperty("--_swipe", "0px");
    }
  };

  const hidden = index >= VISIBLE || index < 0;

  return (
    <li
      ref={ref}
      className="mk-toast"
      data-type={record.type}
      data-front={index === 0 || undefined}
      data-leaving={record.leaving || undefined}
      data-hidden={hidden || undefined}
      data-swiping={swiping || undefined}
      aria-hidden={hidden && !record.leaving ? true : undefined}
      style={
        {
          "--_index": Math.max(index, 0),
          "--_offset": `${offset}px`,
          zIndex: 100 - Math.max(index, 0),
        } as CSSProperties
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="mk-toast-body" data-expanded={expanded || undefined}>
        <ToastIcon type={record.type} />
        <div className="mk-toast-text">
          <div className="mk-toast-title">{record.title}</div>
          {record.description && <div className="mk-toast-description">{record.description}</div>}
        </div>
        {record.action && (
          <button
            type="button"
            className="mk-toast-action"
            onClick={() => {
              record.action?.onClick();
              dismiss(record.id);
            }}
          >
            {record.action.label}
          </button>
        )}
        <button type="button" className="mk-toast-close" aria-label="Dismiss notification" onClick={() => dismiss(record.id)}>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m4.5 4.5 7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </li>
  );
}

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "default") return null;
  if (type === "loading") return <Spinner size={16} label={null} className="mk-toast-icon" />;
  return (
    <svg className="mk-toast-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      {type === "success" ? (
        <path d="m5 8.25 2 2 4-4.25" stroke="var(--mk-overlay)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M8 4.5v4M8 11v.25" stroke="var(--mk-overlay)" strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  );
}
