# Working on Merklon UI

- Follow [PHILOSOPHY.md](./PHILOSOPHY.md): it is the rulebook for every component.
- Components read semantic tokens only (`--mk-*` in `src/tokens.css`). No hard-coded colours, durations or easings.
- Each component is a `.tsx` + `.css` pair in `src/components/`. CSS goes inside `@layer mk`; register new CSS in `src/styles.css` and exports in `src/index.ts`.
- Every state needs designing: hover (inside `@media (hover: hover)`), pressed, focus-visible, disabled, and loading/error where relevant. Add `data-force` hooks so `/design` can show them.
- Run `bun run typecheck`, check the change on `/design` in the website repo, bump `version`, and add a changelog line to README.md before pushing.
- Release steps: SETUP.md, section 5.
