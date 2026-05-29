# Director's Cut — Design Concept

## Scene

Zaswear, alone at his desk late at night after watching a film he wants to remember. A dim amber lamp. A notebook open. He opens the app not to share — to archive, to think, to feel. The interface should feel like that notebook: intimate, unhurried, slightly obsessive in its care for detail.

---

## Register

**Product.** The design serves the content (films, reviews, memories). Never competes with it.

---

## Anti-references

- **Letterboxd** — too social, too green, built for approval
- **IMDb** — information dump, no editorial voice, no intimacy
- **Netflix** — marketing UI, optimized for consumption not reflection
- **Generic dark SaaS dashboards** — blue-gray, Inter, identical cards

---

## Color Strategy: Restrained + one Committed accent

Physical anchor: the reading lamp in a dark room. Everything else recedes; the lamp burns amber.

### Tokens

```css
:root {
  /* Surfaces — warm near-black, barely visible amber tint */
  --bg:              oklch(10%   0.010  52);   /* page background */
  --surface:         oklch(13.5% 0.012  52);   /* cards, panels */
  --surface-hi:      oklch(17%   0.014  52);   /* elevated surfaces */
  --surface-overlay: oklch(17%   0.014  52 / 92%); /* modals backdrop content */

  /* Borders */
  --border:          oklch(100%  0      0  /  8%);
  --border-hi:       oklch(100%  0      0  / 16%);
  --border-focus:    oklch(74%   0.13  72);       /* matches accent */

  /* Text */
  --text:            oklch(94%   0.010  52);   /* primary — warm near-white */
  --text-mid:        oklch(66%   0.012  52);   /* secondary */
  --text-faint:      oklch(44%   0.009  52);   /* disabled, placeholders */

  /* Accent — amber. Not gold. Not luxury. Reading lamp. */
  --accent:          oklch(74%   0.13   72);
  --accent-dim:      oklch(74%   0.13   72 / 14%);
  --accent-hover:    oklch(78%   0.13   72);

  /* Semantic */
  --success:         oklch(70%   0.14  155);
  --warning:         oklch(75%   0.12   85);
  --error:           oklch(62%   0.16   22);
  --info:            oklch(65%   0.12  255);

  /* Overlay */
  --backdrop:        oklch(0%    0      0  / 70%);
}
```

---

## Typography

Three typefaces. Each earns its place.

| Role | Font | Weights | Use |
|---|---|---|---|
| **Display** | Cormorant Garamond | 400i, 600, 700 | Film titles, section headings, the wordmark |
| **UI** | DM Sans | 400, 500, 600 | All interface copy, labels, body text, forms |
| **Data** | Space Mono | 400, 700 | Ratings, years, runtime, IMDb IDs, dates |

### Scale (px / line-height)

| Token | Size | LH | Usage |
|---|---|---|---|
| `text-xs` | 11px | 1.45 | Meta labels, badges |
| `text-sm` | 13px | 1.5 | Secondary UI, table cells |
| `text-base` | 15px | 1.6 | Body, form inputs |
| `text-lg` | 18px | 1.5 | Section subheadings |
| `text-xl` | 22px | 1.35 | Page titles (DM Sans) |
| `text-2xl` | 28px | 1.25 | Film title on detail page |
| `text-3xl` | 38px | 1.15 | Display headings (Cormorant) |
| `text-4xl` | 52px | 1.08 | Hero titles (Cormorant, italic) |

### Rules

- Film titles: always Cormorant, never DM Sans
- UI labels, navigation, buttons: DM Sans only — Cormorant is reserved for content
- Numbers (ratings, years, runtime): Space Mono
- Body line length: 60–72ch max

---

## Spacing

Base unit: 4px.

| Token | px |
|---|---|
| `space-1` | 4 |
| `space-2` | 8 |
| `space-3` | 12 |
| `space-4` | 16 |
| `space-5` | 20 |
| `space-6` | 24 |
| `space-8` | 32 |
| `space-10` | 40 |
| `space-12` | 48 |
| `space-16` | 64 |
| `space-20` | 80 |

---

## Border Radius

| Token | px | Use |
|---|---|---|
| `rounded-sm` | 4 | Badges, small chips |
| `rounded` | 6 | Buttons, inputs |
| `rounded-md` | 8 | Cards, posters |
| `rounded-lg` | 12 | Drawers (top only), large panels |

---

## Shadows

```css
--shadow-card:   0 2px  8px oklch(0% 0 0 / 40%);
--shadow-raised: 0 8px 24px oklch(0% 0 0 / 50%);
--shadow-modal:  0 24px 64px oklch(0% 0 0 / 70%);
--shadow-poster: 0 16px 48px oklch(0% 0 0 / 60%);
```

---

## Components

### Movie Card (grid view)

- Poster image fills the card (aspect-ratio: 2/3)
- Title: Cormorant 600, 16px, 2-line clamp
- Year + rating: Space Mono, 11px, below title
- Hover: slight scale (1.02), shadow lift
- No border on the card — separation via shadow only
- "Mi nota" (my rating) displayed as a number over amber background chip, top-right of poster

### Movie Card (list view)

- Horizontal row: 48px poster thumbnail | title (Cormorant) | year | director | my rating | imdb rating | watched date
- Dense, no wasted space

### Rating Display

- My rating: `7.4` in Space Mono, amber color, slightly larger than surrounding text
- IMDb rating: `8.0` in Space Mono, text-faint, prefixed with `IMDb`
- Never stars. Never bars. Always numbers.

### Navigation

- Left sidebar, fixed, 220px
- Wordmark "Director's Cut" in Cormorant Garamond italic at top
- Nav items: DM Sans 13px, icons optional (lucide-react)
- Active state: amber left indicator (2px) + text becomes accent color

### Forms / Inputs

- Label: DM Sans 11px uppercase tracking-wide, text-faint
- Input: bg-surface border-border, DM Sans 15px
- Focus: border-focus (amber), no box-shadow glow
- Placeholder: text-faint

### Rich Text Editor (Tiptap)

- Minimal toolbar: Bold | Italic | H2 | H3 | Bullet list | Quote
- Content font: DM Sans 15px, 1.7 line-height, max 72ch
- The editor area should feel like a document, not a form

---

## Motion

- Default: 150ms ease-out
- Panels / drawers: 280ms cubic-bezier(.22,1,.36,1)
- No decorative motion — only functional state changes
- `prefers-reduced-motion`: disable all transitions

---

## Poster Treatment

- Always show the poster. It IS the entry point into the film.
- If no poster: `bg-surface-hi` placeholder with film title centered in Cormorant
- Poster in grid: `object-cover`, never distorted
- Poster on detail page: shown large (left column), box-shadow poster

---

## Status Badges

| Status | Color | Label |
|---|---|---|
| vista | success (green) | Vista |
| pendiente | text-faint | Pendiente |
| en progreso | warning (amber) | En progreso |
| descartada | error (red) | Descartada |

---

## AI Slop Test

This interface should look like it was built by one person with strong opinions — not assembled from a design-system template. Signs of success:
- Cormorant headlines feel editorial, not decorative
- The dark background has warmth, not coldness
- Amber accent appears rarely and earns its place
- Typography does the heavy lifting; color is restrained
