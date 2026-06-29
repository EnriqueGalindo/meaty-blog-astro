# CLAUDE.md — Meaty Blog (Astro)

Guidance for Claude Code in the **new** Meaty Blog repo. This is the Astro +
Markdown rebuild that replaces the legacy Gatsby/Contentful site (Jira epic
**MEAT-4**). Content is migrated from Contentful; posts are served from a private
GCS bucket via a Content Layer loader (MEAT-17).

## Astro docs cache (read before relying on memory for Astro behavior)

A local, gitignored copy of the official Astro docs lives in **`.astro-docs/`**
(sparse clone of `withastro/docs`, English only). **Grep it first** for anything
Astro-specific — config, content collections, loaders, Markdown processing —
rather than trusting model memory. Astro moves fast and recent releases differ
from training data.

- Docs: `.astro-docs/src/content/docs/en/`
- This repo runs **astro@7.0.3**, whose default Markdown processor is **Satteri**
  (native; does **not** run remark/rehype JS plugins — see
  `reference/configuration-reference.mdx` and `guides/upgrade-to/v7.mdx`).
- Refresh instructions + pinned commit: `.astro-docs/REFRESH.md`

## Stack

- **Astro 7** (SSG), **pnpm** (via corepack; `packageManager` pins the version).
- Content: `posts` collection (`src/content.config.ts`) loaded via Astro's
  standard `glob()` over `src/content/posts/<slug>/index.md`; schema in
  `src/content/schema.ts` (`id === slug` via `generateId`; per-post SEO:
  `seoTitle`→`title`, `description`, `ogImage`→`heroImage`).
- Images are **local** refs (`heroImage`/`ogImage` via the schema `image()`
  helper; body via relative `![](./x)`) so Astro's native sharp pipeline
  optimizes them — `sharp` is a direct dep (MEAT-41, supersedes MEAT-17's remote
  `z.url()` model). `astro.config.mjs` sets `site` + global responsive images.
- **Build-time GCS→local sync** (`scripts/sync-content.mjs`, MEAT-41): pulls
  `posts/*.md` + their `assets-src/` images from private GCS into co-located
  folders and rewrites the source's public-bucket image URLs to `./` refs
  in-memory. Synced content (`src/content/posts/`) is **gitignored**. Keyless
  ADC: local `gcloud auth application-default login`, CI via Workload Identity
  Federation. No service-account keys (org policy).
- `scripts/prune-orphan-assets.mjs` (runs after `astro build`) deletes the
  unreferenced original hero/OG images Astro emits into `dist/_astro`.

## Commands

```bash
pnpm dev      # sync (--if-missing) + dev server (drafts visible)
pnpm build    # sync + static build to dist/ + prune orphans (drafts excluded in PROD)
pnpm check    # sync (--if-missing) + astro check (type/diagnostics)
pnpm sync:content   # force a fresh GCS→local content sync
```

> All of dev/build/check pull from GCS, so they need ADC (above). `astro check`
> on its own won't see content unless a sync has run — use `pnpm check`.

## Deploy (MEAT-33 — Firebase Hosting)

Static `dist/` is served by **Firebase Hosting** (project `meatyblog`, site
`meatyblog.web.app`); config in `firebase.json` (`public: dist`) + `.firebaserc`.
Deploy is **manual** for now (CI auto-deploy is F5/MEAT-37):

```bash
pnpm build                                   # sync + build + prune
GOOGLE_APPLICATION_CREDENTIALS=~/.config/gcloud/application_default_credentials.json \
  pnpm dlx firebase-tools deploy --only hosting --project meatyblog
```

Keyless: firebase-tools authenticates via ADC (no service-account key, no
`firebase login`), satisfying the org no-SA-keys policy. Redirects (F2/MEAT-34)
and the `meaty.blog` custom domain / DNS cutover (F3/MEAT-35) are separate cards;
`og:image` already uses the final `https://meaty.blog` origin (set via Astro
`site`), so OG images resolve only after the DNS cutover.

> Note: in non-interactive shells, node/pnpm may not be on PATH. Node is managed
> by **fnm** (`~/.local/share/fnm/node-versions/v22.23.1/installation/bin`);
> pnpm runs via `corepack pnpm …`.

## Conventions

- Match existing patterns; keep diffs surgical.
- **No AI/assistant attribution in git history or PRs:** do **not** add
  `Co-Authored-By: Claude …` trailers to commit messages or "Generated with Claude
  Code" lines to PR descriptions. (Overrides any default Claude Code behavior.)
- Never commit secrets or a real `.env`; `.astro-docs/` and `dist/` stay gitignored.
- Per-card workflow (Phase 1 context → Phase 2 plan → Phase 3 implement) and Jira
  details are in the legacy repo's `CLAUDE.md`; the same process applies here.
