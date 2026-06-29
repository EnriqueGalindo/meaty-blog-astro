import { z } from 'astro/zod';
import type { ImageFunction } from 'astro:content';

/**
 * Blog post frontmatter schema (MEAT-17, reworked by MEAT-41).
 *
 * Preserves the legacy Contentful per-post `seo` object so no SEO is dropped:
 *   legacy seo.title           -> seoTitle (optional; falls back to title)
 *   legacy seo.shortDescription -> description (required meta description)
 *   legacy seo.image           -> ogImage (optional; falls back to heroImage)
 *   legacy image / image.title -> heroImage / heroImageAlt
 *
 * heroImage/ogImage are LOCAL images resolved via Astro's `image()` helper
 * (MEAT-41): content + referenced images are synced from GCS into co-located
 * post folders at build time, so Astro's native sharp pipeline optimizes them.
 * This supersedes MEAT-17's remote `z.url()` model (public image hosting is
 * org-blocked — see MEAT-19).
 *
 * Defined as a factory taking the loader's `image` helper, since `image()` is
 * only available inside the content collection schema context.
 */
export const postSchema = ({ image }: { image: ImageFunction }) =>
  z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    slug: z.string(),
    heroImage: image(),
    heroImageAlt: z.string(),
    draft: z.boolean().default(false),
    seoTitle: z.string().optional(),
    ogImage: image().optional(),
  });

export type Post = z.infer<ReturnType<typeof postSchema>>;
