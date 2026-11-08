# Design record

<!-- index: design | Visual direction, tokens and UX principles | Before any UI work. -->
<!-- covers: apps/web/app/globals.css apps/web/components/** apps/web/app/** -->

Status: accepted · Owner: TomSzenzessy · 2026-10-30

The authoritative token list and component inventory live in
[`docs/design-system.md`](./design-system.md) and
[`apps/web/app/globals.css`](../apps/web/app/globals.css). This record is the
direction those tokens serve.

## Direction

A dark, quiet work surface with one confident accent. The product is a notebook,
so the interface stays out of the text's way: near-black background
(`#0a0a0f`), a single purple family (`#bb86fc` → `#7c3aed`) for action and
emphasis, and translucent "glass" surfaces that read as layers rather than
panels. A light theme carries the same structure with inverted tokens.

Type: Space Grotesk for display, Inter for body, JetBrains Mono for code and
metadata. All three are self-hosted (`apps/web/app/fonts.css`), latin and
latin-ext only, so no page blocks on a font CDN.

## Principles

1. **One primary action per screen.** On the marketing pages that is the launch
   list; in the workspace it is the note. Everything else is secondary styling.
2. **Show the mechanism, not the adjective.** A feature card names what happens
   to a file, not how revolutionary it is.
3. **No manufactured urgency.** No countdowns, fake scarcity, or "N people
   viewing". The list promises one email and keeps that promise.
4. **The vault is visible.** Markdown and files are the product; the UI never
   hides where a note lives or makes leaving feel like an export chore.
5. **Motion is explanation.** Animation points at a state change (accordion,
   success panel, nav indicator); it never decorates.
6. **Every state is designed**, including empty, loading, duplicate signup,
   error and offline. A green success panel is a real component, not a toast.

## Theme parity

Every surface is designed in both themes at once. A component that hard-codes a
dark background is a bug: the launch-list panel did exactly that and turned
near-black in light mode while its input turned white. Panel and field colours
now come from `--waitlist-panel-*` and `--waitlist-field-*`, which are defined
per theme next to the other tokens.

## Anchors and fixed chrome

The navbar floats above the page, so it must not swallow the thing it navigates
to. Every section anchor carries `scroll-margin-top: var(--navbar-offset)` (88px
on desktop, 72px on mobile) and the active-section observer uses the same 88px
top band. A nav click that lands with a heading under the chrome is a bug; so is
an active state that highlights the tallest section instead of the one at the
top of the reading area.

## Accessibility floor

- Text contrast ≥ 4.5:1 on its surface; the accent is never the only signal.
- Focus is visible on every interactive element; the accordions are `<details>`,
  the launch form is a real `<form>` with a `<label>`.
- The page works without JavaScript for the launch list (hosted-form fallback in
  `components/waitlist-form.tsx`).
- `prefers-reduced-motion` removes the decorative animations.

## What we deliberately avoid

Glassmorphism over content (blur only on chrome), gradient text longer than a
headline, and icon-only buttons without an accessible name. The brand mark is
three ellipses: an `m`, not a letter in a circle.
