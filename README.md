# Merklon UI

The shared design system for Merklon sites: design tokens plus about 30 React
components. Plain CSS and TypeScript source, no build step, no runtime
dependencies besides React. Live reference: `/design` on merklon.com's dev
server.

- **[SETUP.md](./SETUP.md)**: start a site, deploy, update, edit components
  from another project, and release.
- **[PHILOSOPHY.md](./PHILOSOPHY.md)**: how every Merklon site looks, moves,
  reads and behaves. Point each site's `CLAUDE.md` at it.

```bash
bun add github:AydinCodes/merklon-ui     # install
bun update @merklon/ui                   # update
```

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
| Display | `Badge`, `Card` (+ `CardHeader/Title/Description/Content/Footer`), `Kbd`, `Separator`, `Skeleton`, `Spinner`, `EmptyState`, `MerklonMark`, `MerklonFooter` |
| Forms | `Field`, `Label`, `FieldDescription`, `FieldError`, `Input`, `Textarea`, `Select` (+ `SelectItem/Label/Separator`), `NativeSelect`, `Checkbox`, `RadioGroup` + `Radio`, `Switch`, `Slider`, `SegmentedControl`, `ThemeToggle`, `ThemeSwitch` |
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

- **0.3.1** — PHILOSOPHY: `ThemeSwitch` is the standard theme control.
  SETUP: new sites start from merklon-websites-template.
- **0.3.0** — `ThemeSwitch`: one button for light/dark with a circular reveal,
  the D shortcut, and a fall-back to following the OS. `MerklonFooter`: the
  shared footer (mark home, Contact, socials, theme switch). Optional
  `reset.css` for sites without Tailwind. `useTheme` returns `systemTheme`.
  Tooltip renders a `<span>`, so it is valid inside paragraphs. The Select
  trigger no longer gets the read-only tint. SETUP.md and PHILOSOPHY.md
  replace MOTION.md.
- **0.2.0** — moved to its own repo, installed from GitHub. New `Select`
  built on the menu surface (tap outside closes it and releases focus); the
  old native one is now `NativeSelect`. Input focus ring grows in. Mobile
  pass: 44px touch rows, larger switch and slider thumb on touch, dialogs
  become bottom sheets on phones, menus and selects stay attached while
  scrolling, tooltips close on scroll.
- **0.1** — first release: tokens, 29 components, /design.
