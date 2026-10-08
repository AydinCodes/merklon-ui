# Setting up and maintaining Merklon sites

Everything below assumes your projects live side by side:

```
~/Documents/Projects/merklon/
  merklon-ui/     ← this repo (the components)
  website/        ← merklon.com (hub, contact page, /design)
  merklon-exif/   ← each site, named like its repo
```

## 1. Start a new site

Every site starts from
[merklon-websites-template](https://github.com/AydinCodes/merklon-websites-template).
**Clone it; don't download the zip**, so the site can pull later template
improvements:

```bash
cd ~/Documents/Projects/merklon
git clone https://github.com/AydinCodes/merklon-websites-template.git merklon-exif
cd merklon-exif
claude        # then: "Set this up as a new site"
```

Claude Code follows the template's `AGENTS.md`: it asks for the name, tagline
and URL, runs `bun run new-site`, upgrades Next.js and the packages, builds,
and creates the site's repo with the GitHub CLI (keeping the template as a
second remote).

**Repos.** Every site is **private** and named **`merklon-<app-name>`**.
`merklon-ui` and `merklon-websites-template` stay **public** on purpose:
Vercel installs `merklon-ui` like any public package, with no tokens. (A
private components repo would only work with a GitHub token written into
every site's `package.json` and `bun.lock`.)

**What a site installs.** Nothing beyond the template: `next`, `react`,
`react-dom`, `@merklon/ui`, `@fontsource-variable/inter` and
`@fontsource-variable/outfit`, plus TypeScript and the type packages.

**No Tailwind.** Pages are styled with plain CSS files that use the `--mk-*`
tokens, next to each page. One styling system keeps every site on the design
system. A second one invites drift, especially when an AI is writing the code.
The library still supports Tailwind (see the README) if a site ever truly
needs it.

**The notes come with the package.** `PHILOSOPHY.md` and this file ship
inside `@merklon/ui`, and the template's `CLAUDE.md` loads
`node_modules/@merklon/ui/PHILOSOPHY.md`. Nothing to copy, and every site gets
the latest rules with `bun run ui:update`.

## 2. Deploy

Import the site's private repo into Vercel as usual (grant Vercel's GitHub app
access to it if it isn't listed). Nothing else is needed: `merklon-ui` is
public, so Vercel installs it like any other package. Commit
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
| A stray `<site>/<site>/.next` folder appears after linking | A side effect of the widened Turbopack root while linked. It's build output: delete it. Sites ignore `.next/` at any depth, so it never gets committed. |
| Hydration error mentioning `<div>` inside `<p>` | A block element is inside a paragraph. Use a `<div>` wrapper. |
