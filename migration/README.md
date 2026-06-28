# Migration assets (MEAT-13 / B2)

Catalog of the legacy Contentful image assets, produced by B2 (download & organize).

## Files
- **`asset-manifest.json`** — every Contentful asset (24) with: `id`, `filename` (stable
  basename), `title`, `description`, `alt` (description → falls back to title),
  `contentType`, `bytes`, `referencedBy`, `demoRefsOnly`, and `status`.

## Status values
- **`referenced`** (14) — used by a real post or singleton; **ship these**. Includes the
  6 hero + 5 inline post images, the four-hour OG image (`5DC1…png`), the author photo
  (`IMG_6220.jpg`, via aboutTheAuthor), and the hero/social image (`Background.png`).
- **`demo`** (2) — referenced only by stray demo SEO entries with no real post
  (`filipe-…unsplash` ← "Post 007"; `random-img.jpg` ← "Demo Blog Post"). **Skip.**
- **`orphaned`** (8) — referenced by nothing (`*.jfif` test uploads, `PFPDrawnVer.png`,
  `random_pro_pic.png`). **Skip.**

## Where the originals live
The 14 `referenced` originals are staged (private) at
`gs://meatyblog-content/assets-src/<filename>`. Demo/orphaned assets were downloaded for
the audit but **not** staged.

## Downstream (not B2)
- **C3 / MEAT-19** owns optimization (resize/compress, webp/avif — several originals are
  5–12 MB) and **public serving**. A public GCS bucket is blocked (org PAP enforced);
  serving will likely be Firebase Hosting static assets (absolute URLs, since
  `postSchema.heroImage/ogImage` are `z.url()`).
- **B1 / MEAT-12** post image URLs must be updated to the final public convention once
  C3 lands (they currently point at the private bucket).

## a11y note
Alt text was captured verbatim from Contentful and is weak for several assets
(e.g. `revenge sleep`, `self help`, `IMG 6220`). Worth a copy pass when the posts get
their reading layout (D5) / a11y gate (D7).
