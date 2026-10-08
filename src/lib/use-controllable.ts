"use client";

import { useCallback, useState } from "react";

/**
 * State that can be controlled (value + onChange) or left to the component
 * (defaultValue). The same contract native inputs have.
 */
export function useControllable<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (next: T) => void;
}) {
  const [inner, setInner] = useState<T>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;

  const set = useCallback(
    (next: T) => {
      if (!controlled) setInner(next);
      onChange?.(next);
    },
    [controlled, onChange]
  );

  return [current, set] as const;
}
