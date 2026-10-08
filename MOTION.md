# Motion rules

1. **Interruptible over animated.** Use CSS transitions, which retarget from
   wherever they are when state changes. Avoid keyframe or fire-and-forget
   animations for anything a user can trigger twice.
2. **Respond first, then animate.** Change state on pointer-down; animate only
   the settling (press scale, switch stretch, slider thumb).
3. **Frequency decides motion.** Anything driven by keys or used many times
   a minute (menu highlight, command list, keyboard tab changes, theme switch)
   gets no animation. Rare moments (dialog open, toast arrival) may move.
4. **Instant in, gentle out.** Hover, menus and the command menu appear
   instantly and fade out over `--mk-dur-fade`.
5. **Spatial consistency.** Overlays scale out of their trigger
   (`--mk-origin`) and leave the way they came.
6. **Tokens only.** Use `--mk-dur-*`, `--mk-ease-*`, `--mk-spring*` and
   `--mk-press-scale`, `--mk-enter-*`, so that slow-mo (`data-slowmo`) and
   reduced motion (`--mk-motion: 0`) apply everywhere for free.

## Where GSAP fits

GSAP is **not used in this library**, and should not be added to it.
Components must be small, interruptible and dependency-free, and CSS
transitions plus `linear()` springs cover everything they need.

GSAP stays appropriate **at page level** in a site: choreographed hero
entrances, `SplitText` line reveals, `ScrollTrigger` sequences. These are rare,
non-interactive moments where a timeline is the right tool.

Things in the Merklon website that use GSAP but should move to CSS:
hover scale and lift on nav, logo and social icons (`Navbar`, `Footer`); the
contact button's hover and press (`ContactForm`); the hamburger morph and
mobile-menu entrance; and `pressFeedback()` (an `:active` scale does the same
job, interruptibly).
