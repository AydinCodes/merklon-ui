import {
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
  type SyntheticEvent,
} from "react";
import { cx } from "./cx";

/** One ref callback that feeds several refs — e.g. ours and the consumer's. */
export function composeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as RefObject<T | null>).current = node;
    }
  };
}

type AnyProps = Record<string, unknown> & {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/**
 * Renders its single child instead of its own element, merging props onto it.
 * Powers `asChild`, e.g. a Button that is really a framework <Link>:
 *
 *   <Button asChild><Link href="/pricing">Pricing</Link></Button>
 *
 * Class names and styles merge; event handlers run child first, then ours.
 */
export function Slot({ children, ...slotProps }: AnyProps) {
  if (!isValidElement(children)) return null;
  const child = children as ReactElement<AnyProps>;
  const childProps = child.props;
  const merged: AnyProps = { ...slotProps, ...childProps };

  for (const key of Object.keys(slotProps)) {
    const ours = slotProps[key];
    const theirs = childProps[key];
    if (/^on[A-Z]/.test(key) && typeof ours === "function" && typeof theirs === "function") {
      merged[key] = (event: SyntheticEvent) => {
        (theirs as (e: SyntheticEvent) => void)(event);
        if (!event.defaultPrevented) (ours as (e: SyntheticEvent) => void)(event);
      };
    }
  }

  if (slotProps.ref && childProps.ref) {
    merged.ref = composeRefs(slotProps.ref as Ref<unknown>, childProps.ref as Ref<unknown>);
  }

  merged.className = cx(slotProps.className, childProps.className);
  merged.style = { ...slotProps.style, ...childProps.style };

  return cloneElement(child, merged);
}
