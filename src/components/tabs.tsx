"use client";

import {
  createContext,
  use,
  useId,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithRef,
  type KeyboardEvent,
} from "react";
import { cx } from "../lib/cx";
import type { Tone } from "../lib/types";
import { useControllable } from "../lib/use-controllable";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
  variant: "underline" | "pill";
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(component: string) {
  const context = use(TabsContext);
  if (!context) throw new Error(`<${component}> must be inside <Tabs>.`);
  return context;
}

const toId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "-");

export interface TabsProps extends Omit<ComponentPropsWithRef<"div">, "defaultValue" | "onChange"> {
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  variant?: "underline" | "pill";
  tone?: Tone;
}

export function Tabs({ value, defaultValue, onValueChange, variant = "underline", tone, className, ...props }: TabsProps) {
  const [current, setCurrent] = useControllable({ value, defaultValue, onChange: onValueChange });
  const baseId = useId();
  return (
    <TabsContext value={{ value: current, setValue: setCurrent, baseId, variant }}>
      <div {...props} className={cx("mk-tabs", className)} data-variant={variant} data-tone={tone} />
    </TabsContext>
  );
}

/**
 * The indicator glides when you click — a pointer is slow and the motion
 * shows where you went. With the arrow keys it jumps: keyboard users move
 * fast and the animation would only lag behind them.
 */
export function TabsList({ className, children, ...props }: ComponentPropsWithRef<"div">) {
  const { value, setValue, variant } = useTabs("TabsList");
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const active = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!active) return;
      list.style.setProperty("--_x", `${active.offsetLeft}px`);
      list.style.setProperty("--_w", `${active.offsetWidth}px`);
      // First placement must not slide in from zero.
      if (!list.hasAttribute("data-ready")) requestAnimationFrame(() => list.setAttribute("data-ready", ""));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [value]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not(:disabled)'));
    const index = tabs.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return;
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    event.preventDefault();
    const list = event.currentTarget;
    list.setAttribute("data-instant", "");
    tabs[next].focus();
    setValue(tabs[next].dataset.value!);
    requestAnimationFrame(() => requestAnimationFrame(() => list.removeAttribute("data-instant")));
  };

  return (
    <div
      {...props}
      ref={listRef}
      role="tablist"
      aria-orientation="horizontal"
      className={cx("mk-tabs-list", className)}
      data-variant={variant}
      onKeyDown={onKeyDown}
    >
      <span className="mk-tabs-indicator" aria-hidden="true" />
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends ComponentPropsWithRef<"button"> {
  value: string;
}

export function TabsTrigger({ value, className, ...props }: TabsTriggerProps) {
  const { value: current, setValue, baseId } = useTabs("TabsTrigger");
  const selected = current === value;
  return (
    <button
      {...props}
      type="button"
      role="tab"
      id={`${baseId}-tab-${toId(value)}`}
      aria-controls={`${baseId}-panel-${toId(value)}`}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      data-value={value}
      className={cx("mk-tabs-trigger", className)}
      onClick={(event) => {
        props.onClick?.(event);
        setValue(value);
      }}
    />
  );
}

export interface TabsContentProps extends ComponentPropsWithRef<"div"> {
  value: string;
}

export function TabsContent({ value, className, ...props }: TabsContentProps) {
  const { value: current, baseId } = useTabs("TabsContent");
  return (
    <div
      {...props}
      role="tabpanel"
      id={`${baseId}-panel-${toId(value)}`}
      aria-labelledby={`${baseId}-tab-${toId(value)}`}
      hidden={current !== value}
      tabIndex={0}
      className={cx("mk-tabs-content", className)}
    />
  );
}
