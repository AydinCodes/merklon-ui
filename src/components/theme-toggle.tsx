"use client";

import { useTheme, type ThemePreference } from "../theme/use-theme";
import { SegmentedControl } from "./segmented-control";

const Sun = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="2.75" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 1.5v1.25M8 13.25v1.25M14.5 8h-1.25M2.75 8H1.5M12.6 3.4l-.9.9M4.3 11.7l-.9.9M12.6 12.6l-.9-.9M4.3 4.3l-.9-.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Moon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M13.25 9.6A5.5 5.5 0 0 1 6.4 2.75a5.5 5.5 0 1 0 6.85 6.85Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const Monitor = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1.75" y="2.5" width="12.5" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.5 13.75h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function ThemeToggle({ size = "sm", className }: { size?: "sm" | "md"; className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <SegmentedControl<ThemePreference>
      aria-label="Theme"
      size={size}
      className={className}
      value={theme}
      onValueChange={setTheme}
      options={[
        { value: "light", label: <Sun />, ariaLabel: "Light theme" },
        { value: "dark", label: <Moon />, ariaLabel: "Dark theme" },
        { value: "system", label: <Monitor />, ariaLabel: "Match system theme" },
      ]}
    />
  );
}
