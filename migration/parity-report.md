# Content-Parity & Broken-Link Report — MEAT-16 (B5)

**Date:** 2026-06-29
**Verdict:** ✅ **PASS** (with minor concerns — see below; no migration-regression failures)
**Gate for:** F3/MEAT-35 (DNS cutover), F4/MEAT-36 (retire Contentful)

## Scope & method

Verifies the 6-post migration is faithful in **content structure**, **SEO**, and
**external-link liveness**. URL/redirect parity is **deferred to B3/MEAT-14 + F2/MEAT-34**
(see below). Visual/design parity is **out of scope** (no reading layout yet — D-track).

**Baselines (both, per the Phase 2 decision):**

- **Legacy live site** `https://meaty.blog` (Gatsby 3.14.6) — the authoritative *rendered*
  source-of-truth (what actually shipped to readers). The 6 post pages are server-rendered
  static HTML and were fetched + parsed directly. **Used as the primary baseline.**
- **Migrated target** — `src/content/posts/<slug>/index.md` (source) and the built
  `dist/posts/<slug>/index.html` (rendered), cross-checked against
  `migration/asset-manifest.json` for images.
- **Contentful CDA** — planned as the node-level structural cross-check. **Not run:** it is
  gated by credential-access guardrails in this environment, and proved redundant — the
  legacy rendered HTML already establishes the source-of-truth and resolved the only open
  structural question (heading semantics, below). Space id `pza4tjtaef6j` (incidental, from
  legacy `og:image` URLs) is recorded should a node-level pass be wanted later.

> Counts were produced by direct HTML/Markdown parsing (`scripts`-free throwaway analyzer),
> **not** by the fuzzy fetch-summarizer — which mis-reported heading semantics on first pass
> (see the heading-semantics note).

## Per-post content structure (legacy rendered → migrated rendered)

Migrated = rendered `dist/` article (the rendered truth; e.g. consecutive `>` lines collapse
to one blockquote element). All six match.

| Post | Headings (legacy → migrated) | External links | Blockquotes | Horizontal rules | Match |
|------|------------------------------|----------------|-------------|------------------|-------|
| setup-pivpn-wireguard-raspberry-pi | h1×1, h2×4, h3×3 → identical | 4 → 4 | 2 → 2 | 0 → 0 | ✅ |
| burn-your-self-help-books | h1×1 → h1×1 | 3 → 3 | 0 → 0 | 2 → 2 | ✅ |
| friends-suck-and-making-them-is-worse | h1×1 → h1×1 | 2 → 2 | 0 → 0 | 1 → 1 | ✅ |
| revenge-bedtime-procrastination | h1×1 → h1×1 | 5 (4 unique) → 5 | 0 → 0 | 2 → 2 | ✅ |
| dont-follow-your-dreams | h1×1 → h1×1 | 2 → 2 | 0 → 0 | 2 → 2 | ✅ |
| four-hour-workday-is-misguided | h1×1 → h1×1 | 4 → 4 | 0 → 0 | 3 → 3 | ✅ |

`h1` is the post title. `setup-pivpn` (the lone 2025 post) is the only post with section
headings; it also carries the inline-code config spans (preserved) and 2 config blockquotes.

### Heading-semantics note (resolves the Phase 1/2 open question)

Phase 1 flagged that the 5 older (2022) posts render section labels (e.g. "The current
ideology:", "Who is this for?:") as non-headings, and asked whether the source used real
heading nodes. **Resolved against the legacy HTML directly:**

- `setup-pivpn` — legacy uses real `<h2>`/`<h3>`; migrated uses real `##`/`###`. **Faithful.**
- The 5 older posts — legacy wraps these labels in styled `<span>`/`<p>`, **not** heading
  elements (only the title is `<h1>`). Migrated renders them as plain paragraph text.
  **No semantic-heading regression** — both source and target use zero section headings here.

The only delta is *visual emphasis* on those labels (legacy applied a style class; migrated
is plain text), which falls under the out-of-scope visual/design parity. The earlier
"heading flattening = fidelity gap" was an artifact of the fetch-summarizer inferring `<h2>`
from styling; direct parsing disproves it.

## External-link liveness

**19 unique external links** across the 6 posts (20 counting the one intra-post duplicate —
`hbr.org` appears twice in *revenge*). The migrated posts reproduce the legacy link set
**exactly, per post**, so link parity = PASS. (The acceptance criterion's "21" is a slight
over-count; the verifiable figure is 19 unique.)

Liveness (HEAD, GET fallback, follow redirects, 15s timeout): **16 live**, 3 flagged. None
are migration defects — all three URLs are identical in legacy and migrated:

| URL | Status | Assessment |
|-----|--------|------------|
| `healthline.com/health-news/the-sweet-spot-for-bedtime…` (burn) | 404 | **Genuine rot** — page removed. Pre-existing in legacy. Editorial follow-up (update/replace/archive), not a B5 blocker. |
| `nytimes.com/2012/07/15/fashion/the-challenge-of-making-friends-as-an-adult.html` (friends) | 403 | Bot-protection — browser-reachable. Not dead. |
| `earthweb.com/how-many-people-use-their-degrees/` (dreams) | 403 | Bot-protection — browser-reachable. Not dead. |

Per the Phase 2 threshold (fail only on 4xx/5xx, note rotted/redirects): the two 403s are
anti-scraping false positives; the one 404 is a pre-existing dead link carried over from the
legacy content — flagged as a content concern, not a parity failure.

## SEO parity

| Dimension | Result |
|-----------|--------|
| `<title>` | ✅ Migrated emits server-rendered titles (= post title). Legacy's static `<title>` was empty (client-filled by react-helmet) — migrated is equal-or-better. |
| meta description | ✅ Migrated frontmatter `description` matches the legacy meta description verbatim for all 6 posts. |
| `og:image` | ✅ Same source image per post; legacy pointed at the Contentful CDN (`images.ctfassets.net/pza4tjtaef6j/…`), migrated self-hosts the optimized asset at `https://meaty.blog/_astro/…`. Resolves after the DNS cutover (F3), as expected. |

## Image parity

All **12 referenced images** (6 heroes + 5 inline body images + 1 dedicated `ogImage` for
*four-hour*) are present, accounted for in `migration/asset-manifest.json`, and emitted to
`dist/` as optimized variants. Per-post inline body images: pivpn 0, burn 0, friends 1,
revenge 1, dreams 1, four-hour 2.

> Legacy body-image *counts* (5–11/page) are inflated by the recent-posts sidebar thumbnails
> and author avatar (site chrome) and by lazy-load SVG placeholders, so they are not used for
> body-image parity; the authoritative `asset-manifest.json` mapping is used instead.

## Intentionally dropped (not failures)

Per the acceptance criteria, these legacy features were intentionally not migrated and must
not read as parity failures:

- **Footer social links** — facebook / twitter / instagram / linkedin (confirmed present in
  legacy page chrome on every page, absent in migrated). 
- **Share buttons**, **Mailchimp signup form**, **BackToTop** control, **PWA**.
- Site chrome generally (author header "Enrique Galindo / Data Engineer", recent-posts sidebar).
- **Visual/design parity** — the new site has no reading layout yet (D-track); appearance is
  explicitly out of scope. B5 verifies content fidelity, not appearance.

## Deferred

- **URL / redirect parity** → B3/MEAT-14 (old→new slug map) + F2/MEAT-34 (redirects). Legacy
  paths are Title-Case-with-spaces (e.g. `/posts/Don't Follow Your Dreams`); migrated uses
  kebab slugs (e.g. `/posts/dont-follow-your-dreams`). Redirects are required at cutover.
- **Contentful CDA node-level cross-check** — optional; gated + redundant (see Scope).

## Gate decision

**PASS for F3/MEAT-35 and F4/MEAT-36 on content / SEO / link-liveness.** Content structure,
SEO, and the external-link set are faithfully reproduced across all 6 posts; the only open
items are (a) one pre-existing dead external link (`healthline`, editorial follow-up) and
(b) URL/redirect parity, which is owned by B3/F2 and must be completed before/at the DNS
cutover. Neither blocks retiring Contentful (F4) on content grounds.
