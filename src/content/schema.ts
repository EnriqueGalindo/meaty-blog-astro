import { z } from 'astro/zod';

/**
 * Blog post frontmatter schema (MEAT-17).
 *
 * Preserves the legacy Contentful per-post `seo` object so no SEO is dropped:
 *   legacy seo.title           -> seoTitle (optional; falls back to title)
 *   legacy seo.shortDescription -> description (required meta description)
 *   legacy seo.image           -> ogImage (optional; falls back to heroImage)
 *   legacy image / image.title -> heroImage / heroImageAlt
 *
 * heroImage/ogImage are remote URL strings (not Astro's local `image()` helper),
 * since images are served from a public bucket/CDN (see MEAT-13/MEAT-19).
 *
 * Exported standalone so it can be validated independently of the GCS loader.
 */
export const postSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  description: z.string(),
  slug: z.string(),
  heroImage: z.url(),
  heroImageAlt: z.string(),
  draft: z.boolean().default(false),
  seoTitle: z.string().optional(),
  ogImage: z.url().optional(),
});

export type Post = z.infer<typeof postSchema>;
