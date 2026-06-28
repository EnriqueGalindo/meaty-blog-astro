# Meaty Blog — Design Tokens (MEAT-10 / D1)

The visual source of truth for the **"Butcher's Counter"** brand. Defined in
[`tokens.css`](./tokens.css) as CSS custom properties. Page and component CSS
should consume the **semantic** tokens — never hard-code hex, px, or font names.

> Light, single theme. Dark mode was intentionally dropped (MEAT-10, 2026-06-28).
> Every text/background pairing meets **WCAG 2.1 AA**; ratios are noted in `tokens.css`.

## Color

Use the **semantic** layer (`--color-*`), not the raw palette (`--c-*`).

| Token | Use |
|-------|-----|
| `--color-bg` / `--color-surface` | page background / raised cards |
| `--color-text` / `--color-text-muted` | body text / secondary text |
| `--color-accent` / `--color-accent-hover` | links, primary actions, "meat" red |
| `--color-accent-alt` | green secondary accent (blockquotes, "fresh") |
| `--color-highlight` | gold — **decorative, or text on dark only** (fails AA on cream) |
| `--color-border` | hairlines, dashed rules, the block shadow |
| `--color-inverse-bg` / `--color-inverse-text` | dark strips: header sub-bar, footer, CTA |
| `--color-on-accent` | text placed on `--color-accent` / inverse bg |
| `--color-board-*` | chalkboard hero only (bg / text / muted / accent) |
| `--code-*` | code-block panel + syntax (keyword/function/string/comment) |

⚠️ `--color-highlight` (gold) is **not** AA on cream — only for accents or as text
on `--color-inverse-bg` / `--color-board-bg`.

## Type

Four roles — pick by **function**, not by look:

- `--font-serif` (Bitter) — reading body + article titles
- `--font-sign` (Oswald) — signage, nav, labels, price/weight tags, stamps
- `--font-mono` (JetBrains Mono) — code + meta (dates, reading time, categories)
- `--font-chalk` (Caveat) — chalkboard accents **only**, never body

Sizes (`--fs-*`): `label 11 · meta 12 · small 14 · body 19 · lead 20 · h3 23 · h2 30 · h1 46 · display 60`.
Line-heights: `--lh-tight 1.05` (display/h1), `--lh-snug 1.2` (headings),
`--lh-normal 1.5` (UI), `--lh-body 1.75` (reading).
Weights `--fw-regular…--fw-black` (400–800). Tracking `--tracking-{tight,wide,sign}`.

> Fonts must be loaded by the app (Bitter, Oswald, JetBrains Mono, Caveat). Each
> family has a system fallback in the stack. **(Wiring = out of scope for D1.)**

## Spacing, radius, borders

- Spacing `--space-1…9` on a 4px ramp (`4,8,12,16,24,32,48,64,96`).
- Radius `--radius-{sm 2, md 4, lg 6, pill, round}` — corners stay **sharp** (sm) on stamps/tags/buttons.
- Borders `--border-{hairline 1, rule 2, heavy 3}` — `heavy` = awning underline & header/footer dividers.

## Signature treatments

- `--shadow-block` — offset block shadow on cards/banners (the butcher-counter look).
- `--shadow-block-ink` — button shadow; pair with a translate on `:hover` to "press in."
- `--shadow-lift` — chalkboard / floating sheet.
- `--awning-stripe` — striped deli awning; use as `background` on a ~14px bar with a
  `--border-heavy` bottom.
- `--paper-grain` — faint paper texture; layer under `--color-bg`.

## Layout

`--measure 720px` (reading column ≈70ch) · `--container 1080px` · `--container-wide 1000px`.

## Brand assets (separate from this file)

- **Logo:** marbled-DB icon → inside inspection stamp (**MEATY BLOG / PRIME CUTS**) → Oswald wordmark.
- **End-of-article stamp:** "WELL DONE / THANKS FOR READING".
- One-color reproducible in meat / ink / cream-reversed. (SVG assets tracked separately; favicon/OG = D2.)

## Usage

```css
/* astro layout or global stylesheet */
@import './styles/tokens.css';

.post-body { font-family: var(--font-serif); font-size: var(--fs-body); line-height: var(--lh-body); color: var(--color-text); }
.post-body a { color: var(--color-accent); }
.card { background: var(--color-surface); border: var(--border-rule) solid var(--color-ink); border-radius: var(--radius-lg); box-shadow: var(--shadow-block); padding: var(--space-5); }
```
