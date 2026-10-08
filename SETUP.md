# Setting up and maintaining Merklon sites

Everything below assumes your projects live side by side:

```
~/Documents/Projects/merklon/
  merklon-ui/     ← this repo (the components)
  website/        ← merklon.com (hub, contact page, /design)
  some-site/      ← any other Merklon site
```

## 1. Start a new site

```bash
bunx create-next-app@latest some-site --ts --app --src-dir --no-tailwind --no-eslint --use-bun
cd some-site
bun add github:AydinCodes/merklon-ui @fontsource-variable/inter @fontsource-variable/outfit
```

**`next.config.ts`** (copy this whole file; the link detection is explained in
section 4):

```ts
import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

const uiIsLinked =
  fs.lstatSync(path.join(process.cwd(), "node_modules/@merklon/ui"), { throwIfNoEntry: false })?.isSymbolicLink() ?? false;

const nextConfig: NextConfig = {
  transpilePackages: ["@merklon/ui"],
  ...(uiIsLinked && { turbopack: { root: path.resolve(process.cwd(), "..") } }),
};

export default nextConfig;
```

**`src/app/globals.css`** (replace everything in it):

```css
@import "@merklon/ui/reset.css";   /* skip this line if the site uses Tailwind */
@import "@merklon/ui/styles.css";
```

If the site uses Tailwind v4, use this instead:

```css
@layer theme, base, mk, components, utilities;
@import "tailwindcss";
@import "@merklon/ui/styles.css";
```

**`src/app/layout.tsx`**:

```tsx
import "@fontsource-variable/outfit/wght.css";
import "@fontsource-variable/inter/wght.css";
import "./globals.css";
import { ThemeScript, Toaster } from "@merklon/ui";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="mk-root" data-tone="merklon" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

**Every page** ends with the shared footer. Leave the props out on other
sites, and it links to merklon.com and the shared contact page:

```tsx
import { MerklonFooter } from "@merklon/ui";

<MerklonFooter />
```

**Add the scripts below to the site's `package.json`** (section 4 explains them):

```json
"scripts": {
  "ui:link": "cd ../merklon-ui && bun link && cd - && bun link @merklon/ui",
  "ui:update": "bun update @merklon/ui"
}
```

**Tell AI agents about the philosophy.** Add this line to the site's
`CLAUDE.md` (or `AGENTS.md`):

```
@node_modules/@merklon/ui/PHILOSOPHY.md
```

Then read [PHILOSOPHY.md](./PHILOSOPHY.md) and build the one idea.

## 2. Deploy

Import the repo into Vercel as usual. Nothing extra is needed: the components
repo is public, so Vercel installs it like any other package. Commit
`bun.lock` so Vercel builds exactly the component version you tested.

## 3. Update a site to the latest components

```bash
bun run ui:update      # or: bun update @merklon/ui
```

The lockfile pins the exact commit, so a site only changes when you run this.
Update one site, check it, then commit the lockfile. Repeat for the next site.

## 4. Change a component while working in another project

Yes, you can edit the components from inside any site, and the changes land
in this repo.

```bash
# in the site you're working on
bun run ui:link
```

Now `node_modules/@merklon/ui` in that site *is* `../merklon-ui`. Edit the
components in place, and the site's dev server picks the changes up live.
(The `next.config.ts` above notices the link and widens Turbopack's root to
the shared folder. Without that, Next can't see files outside the project.)

When you're happy:

```bash
cd ../merklon-ui
bun run typecheck
# bump "version" in package.json and add a line to the changelog in README.md
git add -A && git commit -m "Describe the change" && git push
cd -
bun run ui:update     # replaces the link with the GitHub version you just pushed
```

`ui:update` both undoes the link and pulls the latest release, so it's the
same command everywhere. Run it in the other sites too.

Use `ui:update`, not `bun add github:…`: the lockfile still pins the old
commit, and `bun add` keeps it.

Good to know:

- Any `bun install`, `bun add` or `bun remove` in the site undoes the link.
  Run `bun run ui:link` again.
- **With Claude Code**, open the site as usual and add the components folder
  with `/add-dir ../merklon-ui` (or start it with
  `claude --add-dir ../merklon-ui`). Claude can then edit, commit and push the
  components repo from that session.
- Check the change against `/design` on merklon.com's dev server before
  pushing. Every component and state is there in both themes.

## 5. Release checklist (components repo)

1. `bun run typecheck` passes.
2. Checked on `/design` in light and dark, at phone and desktop widths.
3. `version` bumped in `package.json` (patch for fixes, minor for new
   components or visual changes).
4. Changelog line added in `README.md`.
5. Committed and pushed to `main`.
6. `bun run ui:update` in each site; check it; commit its lockfile.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Colours blank or transparent | The element isn't inside `.mk-root`. Put `className="mk-root"` on `<html>`. |
| `Module not found: Can't resolve '@merklon/ui'` while linked | `next.config.ts` is missing the link detection from section 1. |
| `Export … doesn't exist` after linking | An install replaced the link with an older GitHub version. Run `bun run ui:link` again. |
| Components look unstyled (no borders or fills) | The site has no Tailwind and no `reset.css` import, or imports a reset after `styles.css` outside `@layer`. Use the globals from section 1. |
| Theme flashes on load | `<ThemeScript />` is missing from `<head>`, or `suppressHydrationWarning` is missing from `<html>`. |
| Hydration error mentioning `<div>` inside `<p>` | A block element is inside a paragraph. Use a `<div>` wrapper. |
