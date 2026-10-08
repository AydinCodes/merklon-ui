# Merklon UI

The shared design system for Merklon sites: design tokens plus about 30 React
components. Plain CSS and TypeScript source, no build step, no runtime
dependencies besides React. Live reference: `/design` on merklon.com.

## Add it to a site

```bash
bun add github:AydinCodes/merklon-ui
```

1. **Let Next compile it** (it ships TypeScript source):
   ```ts
   // next.config.ts
   const nextConfig = { transpilePackages: ["@merklon/ui"] };
   ```
2. **Import the styles once** from your global CSS. With Tailwind v4, set the
   layer order first so utilities can still override components:
   ```css
   @layer theme, base, mk, components, utilities;
   @import "tailwindcss";
   @import "@merklon/ui/styles.css";
   ```
   Without Tailwind, the last line is all you need.
3. **Load the fonts** (`bun add @fontsource-variable/inter @fontsource-variable/outfit`
   and import their `wght.css` in the root layout), or override
   `--mk-font-sans` and `--mk-font-display`.
4. **Opt in and prevent a flash of the wrong theme** in the root layout:
   ```tsx
   import { ThemeScript, Toaster } from "@merklon/ui";

   <html lang="en" className="mk-root" data-tone="merklon" suppressHydrationWarning>
     <head><ThemeScript /></head>
     <body>
       {children}
       <Toaster />
     </body>
   </html>
   ```
   Put `mk-root` on `<html>` to theme the whole site, or on a wrapper to theme
   only part of it.

## Update a site

```bash
bun update @merklon/ui
```

That pulls the latest commit on `main`. The site's lockfile pins the exact
commit, so a site only changes when you run this. Update one site, check it,
then the rest. Commit the lockfile so Vercel builds the same version.

## Work on the components

1. Edit here, then `bun run typecheck`.
2. To see changes live in a site before pushing:
   ```bash
   # once, in this repo
   bun link
   # in the site
   bun link @merklon/ui
   ```
   When you're done, run `bun add github:AydinCodes/merklon-ui` in the site
   to go back to the GitHub version.
3. Bump `version` in `package.json`, add a line to the changelog below,
   commit and push. Then run `bun update @merklon/ui` in each site.

## Theming

- **Light and dark.** The OS preference is the default. `useTheme()` and
  `<ThemeToggle />` let the visitor override it; the choice is saved under
  `localStorage["mk-theme"]` and applied before first paint by `ThemeScript`.
  `data-theme="dark"` on any element inside `.mk-root` re-themes just that subtree.
- **Merklon colours.** `data-tone="merklon"` on any element, or `tone="merklon"`
  on a component, switches the accent to the logo blues. Leave it off for the
  neutral ink accent.
- **Re-skin by changing tokens only.** Write overrides as unlayered CSS after
  the import; unlayered CSS always beats `@layer mk`.
  ```css
  [data-tone="sunset"] { --mk-accent: light-dark(#ea580c, #fb923c); /* …6 more */ }
  :root { --mk-radius-button: 10px; }
  ```
  Components never hard-code colours, so nothing else needs touching.

> Colour tokens are declared on `.mk-root` (and on nested `[data-theme]`
> elements), not on `:root`. That is deliberate: `light-dark()`, and the
> Lightning CSS fallback that Next/Tailwind emit for older Safari, both resolve
> where the variable is declared. If colours ever come out blank, check that
> the element is inside `.mk-root`.

## Components

| Group | Exports |
| --- | --- |
| Actions | `Button`, `IconButton`, `TextLink` |
| Display | `Badge`, `Card` (+ `CardHeader/Title/Description/Content/Footer`), `Kbd`, `Separator`, `Skeleton`, `Spinner`, `EmptyState`, `MerklonMark` |
| Forms | `Field`, `Label`, `FieldDescription`, `FieldError`, `Input`, `Textarea`, `Select` (+ `SelectItem/Label/Separator`), `NativeSelect`, `Checkbox`, `RadioGroup` + `Radio`, `Switch`, `Slider`, `SegmentedControl`, `ThemeToggle` |
| Overlays | `Tooltip`, `Toaster` + `toast()`, `Dialog`, `AlertDialog` (+ `DialogTrigger/Content/Header/Title/Description/Body/Footer/Close`), `DropdownMenu` (+ `Trigger/Content/Item/Label/Separator`), `Command`, `CommandDialog` (+ `Group/Item/Empty/Separator`) |
| Navigation | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| Helpers | `useTheme`, `useHotkey`, `useControllable`, `Slot` (`asChild`), `cx`, `place` |

Conventions, taken from the Devouring Details React handbook:
- Variants are enums (`variant="destructive"`), never stacks of booleans.
- Composition over configuration: compound parts rather than huge data props.
- `asChild` renders your element, such as Next's `<Link>`, with the component's behaviour.
- Every control takes `tone`, forwards `className` and `ref`, and spreads native props.
- `data-force="hover|active|focus"` pins a visual state. It exists only for style guides.

## Browser support

The library uses modern platform features, with fallbacks where needed:
`light-dark()`, `:has()`, the Popover API, `<dialog>`, `@starting-style`,
`transition-behavior: allow-discrete`, `field-sizing` and `linear()` easing.
In browsers without exit-transition support, closing is instant (which is fine,
since closes are only fades); without `field-sizing`, textareas get a resize
handle instead of auto-growing.

## Changelog

- **0.2.0** — moved to its own repo, installed from GitHub. New `Select`
  built on the menu surface (tap outside closes it and releases focus); the
  old native one is now `NativeSelect`. Input focus ring grows in. Mobile
  pass: 44px touch rows, larger switch and slider thumb on touch, dialogs
  become bottom sheets on phones, menus and selects stay attached while
  scrolling, tooltips close on scroll.
- **0.1** — first release: tokens, 29 components, /design.
