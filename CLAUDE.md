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
- Content: `posts` collection (`src/content.config.ts`) loaded from private GCS
  by `src/loaders/gcs-markdown.ts`; schema in `src/content/schema.ts`
  (`id === slug`; per-post SEO: `seoTitle`→`title`, `description`, `ogImage`→`heroImage`).
- Build/`astro check` run the GCS loader → need GCP creds: local ADC
  (`gcloud auth application-default login`), CI via Workload Identity Federation.
  No service-account keys (org policy).

## Commands

```bash
pnpm dev      # dev server (drafts visible)
pnpm build    # static build to dist/ (drafts excluded in PROD)
pnpm exec astro check   # type/diagnostic check (also runs the loader)
```

> Note: in non-interactive shells, node/pnpm may not be on PATH. Node is managed
> by **fnm** (`~/.local/share/fnm/node-versions/v22.23.1/installation/bin`);
> pnpm runs via `corepack pnpm …`.

## Conventions

- Match existing patterns; keep diffs surgical.
- Never commit secrets or a real `.env`; `.astro-docs/` and `dist/` stay gitignored.
- Per-card workflow (Phase 1 context → Phase 2 plan → Phase 3 implement) and Jira
  details are in the legacy repo's `CLAUDE.md`; the same process applies here.
