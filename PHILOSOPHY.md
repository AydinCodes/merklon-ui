# Merklon design philosophy

Every Merklon site follows this document. It is short on purpose: if a
decision isn't covered here, choose the quieter option.

## What a Merklon site is

- **One idea per site.** A single, shareable purpose, such as "see what your
  photos reveal about you". If a feature doesn't serve that idea, it belongs on
  another site.
- **Instantly useful.** The idea works on the first screen, with no sign-up,
  tour or splash. Explanation comes after the thing itself.
- **Made to be shared.** Every site needs a clear title, a one-line
  description and a share image (Open Graph), because a link is how people
  find it.
- **Part of a family.** The same mark, type, colours and footer everywhere.
  The `MerklonFooter` links back to the hub and to the shared contact page, so
  anyone who finds one site can find the rest.

## The ten principles

1. **Interruptible over animated.** Nothing makes you wait for it to finish.
   Use CSS transitions, which reverse from wherever they are.
2. **Respond first, then animate.** Change state on pointer-down; animate
   only the settling.
3. **Match the trigger to the stakes.** Low-stakes actions (copy) can fire on
   press. Destructive ones wait for an explicit, cancellable confirmation, and
   the safe choice gets focus first.
4. **Frequency decides motion.** Anything used many times a minute, or driven
   by keys, does not animate. Rare moments (a dialog opening, a toast
   arriving, the first load) may.
5. **Spatial consistency.** Things grow out of what opened them and leave the
   way they came.
6. **Feedback on every input.** Hover, pressed, focus-visible, disabled,
   loading, error and success are all designed. If one is missing, the element
   isn't finished.
7. **Generous hit areas.** At least 40px, and 44px on touch, even when the
   visible element is smaller.
8. **Fidget, sparingly.** One or two things that are nice to play with (the
   theme switch, a switch thumb). Never in the way.
9. **Sparse visuals, dense interaction.** Remove before adding. Effects are
   earned by behaviour, not decoration. Nothing shifts layout.
10. **Care in the unglamorous places.** 404s, empty, error and loading states,
    focus order, keyboard paths, reduced motion.

Sources: Rauno Freiberg, *Invisible Details of Interaction Design*; Apple,
*Designing Fluid Interfaces* (WWDC18); brandur, *Interfaces*; Emil Kowalski,
*7 Practical Animation Tips*; Devouring Details.

## Visual rules

- **Colour.** Neutrals do almost all the work. Merklon blue (`--mk-accent`
  under `data-tone="merklon"`) is for the primary action, focus and selection,
  and nothing decorative. Red, green and amber only ever mean danger, success
  and caution.
- **Type.** Outfit for display, Inter for everything else. Use the eight
  `--mk-text-*` sizes and nothing in between. Use tabular figures for numbers
  that change.
- **Shape.** Buttons are pills. Inputs are soft squares (10px). Cards are 16px.
- **Lines and depth.** Hairline borders at low contrast. In light mode, depth
  comes from soft shadow; in dark mode, from lighter surfaces and a 1px top
  highlight.
- **Icons.** 16px with a 1.5 stroke, inline with text. Icon-only buttons always
  have a label and a tooltip.
- **Light and dark.** Both are first-class. Check every screen in both before
  shipping.
- **Never:** gradients behind text, glows, floating orbs, glass for its own
  sake, parallax, scroll-jacking, more than one accent colour, or hover
  effects that move layout.

## Motion

Use tokens only: `--mk-dur-*`, `--mk-ease-*`, `--mk-spring*`,
`--mk-press-scale` and `--mk-enter-*`. That way slow-motion and reduced
motion apply everywhere without extra work.

| Moment | Treatment |
| --- | --- |
| Hover | Arrives instantly, fades out over `--mk-dur-base` |
| Press | Scales to `--mk-press-scale` within `--mk-dur-fast`, springs back |
| Menus, command lists, tabs via keys | No animation at all |
| Menu, select or command menu closing | Fades over `--mk-dur-fade` |
| Dialog opening | Grows out of its trigger, `--mk-dur-slow`; bottom sheet on phones |
| Toast arriving | Slides in from its edge, `--mk-dur-reveal` |
| Theme change | Circular reveal from the switch |
| Page load | One gentle fade-up at most |

Keep UI motion under 300ms. Never animate from `scale(0)`; start at 0.96.
Under reduced motion, movement stops and short fades remain. Spinners keep
turning, because their movement is the message.

**GSAP** is not part of the component library and never will be. It is
acceptable in a site for a choreographed hero or a scroll sequence, which are
rare, non-interactive moments. Never use it for hovers, presses or anything
a user can trigger repeatedly.

## Mobile

Mobile is not a smaller desktop; check it on a real phone.

- Touch targets are 44px. Primary actions on phones are full width and within
  thumb reach.
- Inputs use 16px text, so iOS doesn't zoom in. Use `inputMode` and
  `autoComplete` on every field.
- Respect safe areas (`env(safe-area-inset-*)`) at the screen edges.
- Use `100dvh`, not `100vh`.
- Nothing important lives behind hover. Tooltips are a bonus, never the only
  label.
- Dialogs become bottom sheets. Popovers stay attached to their trigger while
  scrolling.
- Check that nothing scrolls sideways at 360px wide.

## Accessibility

- Everything works with a keyboard, in reading order, with a visible focus
  ring. Every page starts with a skip link if it has navigation.
- Real elements first: `<button>`, `<a>`, `<dialog>`, native inputs. Use ARIA
  only where the platform has nothing.
- Every control has a label. Errors are tied to their field and announced.
- Body text meets WCAG AA contrast in both themes.

## Words

- Short, plain and specific. Australian English ("colour").
- Buttons say what happens ("Send message", not "Submit").
- Errors say what went wrong and what to do next, and never blame the person.
  Keep what they typed.
- Empty states say what's missing and the one next step.
- No exclamation marks, no "Oops", no jargon.

## Before you ship

- [ ] The idea works on the first screen, on a phone.
- [ ] Light and dark both checked; no flash of the wrong theme on load.
- [ ] Every interactive element has hover, pressed, focus, disabled and (where
      relevant) loading, error and success states.
- [ ] Keyboard-only run-through; reduced-motion run-through.
- [ ] No layout shift while loading; skeletons match the final content.
- [ ] 404 page, title, description and share image in place.
- [ ] `MerklonFooter` present; contact link works.
