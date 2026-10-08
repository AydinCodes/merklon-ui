export const THEME_STORAGE_KEY = "mk-theme";

/**
 * Applies a saved light/dark choice to <html> before the first paint, so a
 * returning visitor never sees the wrong theme flash. Render it in <head> of
 * the root layout, and put suppressHydrationWarning on <html>:
 *
 *   <html lang="en" suppressHydrationWarning>
 *     <head><ThemeScript /></head>
 *
 * With nothing saved, no attribute is set and prefers-color-scheme decides.
 */
export function ThemeScript({ storageKey = THEME_STORAGE_KEY }: { storageKey?: string }) {
  const code = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
    storageKey
  )});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
