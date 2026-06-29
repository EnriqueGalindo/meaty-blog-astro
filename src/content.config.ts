import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { postSchema } from './content/schema';

// Posts are synced from private GCS into co-located folders at build time
// (MEAT-41): src/content/posts/<slug>/index.md with referenced images
// alongside. Loaded via Astro's standard glob() loader so local images get the
// native sharp pipeline. Replaces the retired gcsMarkdownLoader (MEAT-17).
const posts = defineCollection({
  loader: glob({
    base: './src/content/posts',
    pattern: '**/index.md',
    // Keep id === slug (MEAT-17/18 route on it). Prefer the frontmatter slug;
    // fall back to the folder name (strip the trailing "/index").
    generateId: ({ entry, data }) =>
      String(data.slug ?? entry.replace(/\/index\.md$/, '')),
  }),
  schema: postSchema,
});

export const collections = { posts };
