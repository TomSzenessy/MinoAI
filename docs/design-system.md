# Design System

> All visual and interaction guidelines for Mino. The logo (`logo.svg`) is the source of truth for brand colors.

[← Back to docs](./README.md)

---

## Design Philosophy

Derived from the **Mino logo** ([logo.svg](../logo.svg)), the mino.ink website, the screen.png mockup, and the workspace prototypes:

- **Glassmorphism** — Frosted glass panels with `backdrop-filter: blur()`, translucent backgrounds (`bg-white/[0.03]` to `bg-white/[0.08]`), and subtle borders (`border-white/5`)
- **Dark-first** — Warm charcoal backgrounds (`#1E1E1E` from logo) as the default, with light mode as an option
- **Lavender-purple accent** — The brand purple `#BB86FC` (from logo.svg) as the singular identity color, with a full derived scale
- **All-rounded geometry** — No sharp edges anywhere. The logo uses only ellipses and circles; every UI element follows with generous `border-radius`
- **Spatial depth** — Multiple layers of transparency, glows, and shadows to create visual hierarchy
- **Micro-animations** — Subtle transitions, hover effects, floating elements, and pulse glows

---

## Color Palette

```css
/* === MINO DESIGN TOKENS === */
/* Source of truth: logo.svg (#BB86FC purple, #1E1E1E dark circle) */

/* Background Scale (Dark Mode) — derived from logo #1E1E1E */
--mino-bg-base:     #121212;    /* Deepest background (near-black) */
--mino-bg-surface:  #1E1E1E;    /* Card/panel backgrounds (logo circle) */
--mino-bg-elevated: #2A2A2A;    /* Elevated surfaces */
--mino-bg-hover:    #353535;    /* Hover states */
--mino-bg-active:   #404040;    /* Active/selected states */

/* Background Scale (Light Mode) */
--mino-bg-base-light:     #FFFFFF;
--mino-bg-surface-light:  #FAFAFA;
--mino-bg-elevated-light: #F3F0FF;  /* Faint purple tint */

/* Purple Accent Scale — centered on logo #BB86FC */
--mino-purple-50:   #F5F0FF;    /* Lightest tint */
--mino-purple-100:  #E8DBFF;
--mino-purple-200:  #D4BFFF;
--mino-purple-300:  #C4A6FE;
--mino-purple-400:  #BB86FC;    /* ★ BRAND PRIMARY (logo color) */
--mino-purple-500:  #A96EF5;    /* Slightly deeper interactive */
--mino-purple-600:  #9B5DE5;    /* Primary buttons */
--mino-purple-700:  #7E3FCC;    /* Hover states */
--mino-purple-800:  #6229A8;
--mino-purple-900:  #481985;
--mino-purple-950:  #2D0F54;    /* Darkest shade */

/* Text */
--mino-text-primary:   rgba(255, 255, 255, 1.0);
--mino-text-secondary: rgba(255, 255, 255, 0.6);
--mino-text-tertiary:  rgba(255, 255, 255, 0.4);
--mino-text-muted:     rgba(255, 255, 255, 0.2);

/* Semantic */
--mino-success: #22C55E;
--mino-warning: #EAB308;
--mino-error:   #EF4444;
--mino-info:    #3B82F6;

/* Glass Effects */
--mino-glass-bg:     rgba(255, 255, 255, 0.04);
--mino-glass-border: rgba(187, 134, 252, 0.08);  /* Purple-tinted borders */
--mino-glass-blur:   blur(16px);

/* Glow Effects — using logo purple #BB86FC */
--mino-glow:    0 0 30px -5px rgba(187, 134, 252, 0.35);
--mino-glow-lg: 0 0 60px -10px rgba(187, 134, 252, 0.25);
```

---

## Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Display / Headings | Space Grotesk | 600-700 | 24-48px |
| Body / UI | Inter | 400-500 | 14-16px |
| Code / Markdown | JetBrains Mono | 400 | 13-14px |

---

## Component Language

- **Buttons:** Fully rounded (`border-radius: 12-16px`), primary = solid `#BB86FC` purple, secondary = ghost with `rgba(187, 134, 252, 0.1)` border
- **Cards:** Large radius (`20-28px`), glass background, purple-tinted border, hover glow
- **Navigation:** Fluid floating navbar (from mino.ink), pill-shaped active indicators in `#BB86FC`
- **Sidebar:** Collapsible, glass background on `#1E1E1E` surface, file tree with folder/file icons
- **Editor:** Full-width markdown with line numbers, code block syntax highlighting, WYSIWYG toggle
- **Status bar:** Bottom bar with sync status, word count, cursor position (from screen.png mockup)
- **Action toolbar:** Floating right-side buttons for text, image, link, AI actions (from screen.png)
- **All corners:** Generously rounded everywhere — following the logo's elliptical, zero-sharp-edge philosophy

---

## Logo Usage

The Mino logo is three vertical ellipses of varying heights inside a dark circle, forming a stylized **M** resembling a sound wave:

```svg
<!-- logo.svg: 200×200 viewBox -->
<circle cx="100" cy="100" r="95" fill="#1E1E1E" />       <!-- Dark container -->
<ellipse cx="50"  cy="100" rx="17" ry="50" fill="#BB86FC" /> <!-- Left pill -->
<ellipse cx="100" cy="100" rx="20" ry="70" fill="#BB86FC" /> <!-- Center (taller) -->
<ellipse cx="150" cy="100" rx="17" ry="50" fill="#BB86FC" /> <!-- Right pill -->
```

**Usage rules:**
- **Primary mark:** Three-pill icon on dark circle (use as-is from `logo.svg`)
- **Wordmark:** Three-pill icon + "ino" in Space Grotesk 600 weight
- **Minimum size:** 24×24px for icon, 80px wide for wordmark
- **Clear space:** Minimum padding = 25% of logo width on all sides
- **Color variants:** Purple on dark (`#BB86FC` on `#1E1E1E`), purple on black (`#BB86FC` on `#121212`), monochrome white on dark for loading states
- **Never:** Stretch, rotate, add outlines, change pill proportions, or use non-brand colors

---

## Design File Deliverable

A `design-tokens.css` file will be created containing all CSS custom properties, and a `tailwind.preset.js` extending Tailwind with the Mino theme. All components across web and mobile will consume these tokens for guaranteed consistency.

---

## Design Reference & Inspiration

### From the Existing Prototypes

| Source | What to Keep |
|--------|-------------|
| **screen.png** | Dark workspace layout, purple file tree highlights, code block rendering, status bar with sync indicator and word count, right-side action toolbar |
| **app/ (Kimi K2.5)** | Landing page design (gradient orbs, glass cards, mouse parallax), Editor/Sidebar/NoteList component structure, Tailwind config with purple scale + dark colors + glow shadows |
| **workspace/ (Z.ai GLM-5)** | Next.js App Router structure, Prisma schema patterns, MDX editor integration, Zustand state management, Framer Motion animations |
| **mino.ink** | Fluid floating navbar with glass effect, Mino logo (three vertical pills), purple active pill indicators, card-based feature layout |
| **openclaw/** | Plugin/skill architecture, Agent workspace pattern (AGENTS.md/SOUL.md/TOOLS.md), Multi-channel support, Session management, Security model (permissions, allowlists), Memory extensions (LanceDB), Tool schema design |

### Design Principles Summary

1. **Warm dark backgrounds** (`#121212` base, `#1E1E1E` surfaces) — derived from the logo's dark circle
2. **`#BB86FC` lavender-purple as the ONLY accent** — the logo color, never use blue/green/red for primary actions
3. **Glass everywhere** — panels, cards, modals all use `backdrop-blur` + translucent backgrounds with purple-tinted borders
4. **Glow effects** — `#BB86FC` purple box-shadows on hover states and focus states
5. **Smooth transitions** — 300ms ease-out for all interactive elements
6. **The Mino logo** — three vertical ellipses (stylized M / sound wave) in `#BB86FC` on `#1E1E1E` circle
7. **All-rounded geometry** — generous `border-radius` on every element, following the logo's zero-sharp-edge philosophy
