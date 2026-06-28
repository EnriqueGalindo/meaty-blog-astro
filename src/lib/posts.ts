import { getCollection, type CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;

/**
 * Single source of truth for which posts are published, and in what order.
 *
 * Used by BOTH the home listing and the post route's `getStaticPaths` so the
 * draft predicate can never diverge — filtering only the listing would still
 * build (and ship) a `/posts/<draft-slug>/` page (MEAT-18 plan v2, fix #1).
 *
 * Drafts are shown in `astro dev` and excluded from production builds:
 *   import.meta.env.PROD ? !data.draft : true
 *
 * Sorted newest-first by `date`.
 */
export async function getPublishedPosts(): Promise<PostEntry[]> {
  const posts = await getCollection('posts', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true
  );
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
