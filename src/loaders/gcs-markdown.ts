import type { Loader, LoaderContext } from 'astro/loaders';
import { Storage } from '@google-cloud/storage';
import matter from 'gray-matter';

export interface GcsMarkdownOptions {
  /** GCS bucket name holding the post markdown (e.g. "meatyblog-content"). */
  bucket: string;
  /** Object-key prefix to scan. Defaults to "posts/". */
  prefix?: string;
  /** GCP project for the Storage client (quota/billing). */
  projectId?: string;
}

/**
 * Astro Content Layer loader that reads post markdown from a private GCS bucket
 * at build time (MEAT-17). Auth is keyless via Application Default Credentials:
 * local dev uses `gcloud auth application-default login`; CI uses Workload
 * Identity Federation. No service-account key is ever used.
 */
export function gcsMarkdownLoader({
  bucket,
  prefix = 'posts/',
  projectId = 'meatyblog',
}: GcsMarkdownOptions): Loader {
  return {
    name: 'gcs-markdown',
    async load({ store, parseData, generateDigest, renderMarkdown, logger }: LoaderContext) {
      if (!bucket) {
        throw new Error(
          'gcsMarkdownLoader: bucket name is required (set GCS_CONTENT_BUCKET).'
        );
      }

      const storage = new Storage({ projectId });
      logger.info(`Loading markdown from gs://${bucket}/${prefix}`);

      // List objects. A failure here (missing creds, no access) MUST throw — we
      // never want to resolve with an empty list and silently ship stale content.
      let files;
      try {
        [files] = await storage.bucket(bucket).getFiles({ prefix });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logger.error(`Failed to list gs://${bucket}/${prefix}: ${msg}`);
        throw e;
      }

      const markdown = files.filter((f) => f.name.endsWith('.md'));

      // Clear the persisted store first so a removed post (or a partial fetch)
      // cannot leave a stale entry behind that still passes the build.
      store.clear();

      const seen = new Set<string>();
      for (const file of markdown) {
        let raw: string;
        try {
          const [buf] = await file.download();
          raw = buf.toString('utf-8');
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          logger.error(`Failed to download ${file.name}: ${msg}`);
          throw e;
        }

        const { data: frontmatter, content } = matter(raw);

        // id is the routing key (MEAT-18 routes on it). Keep id === slug as the
        // single source of truth: prefer the frontmatter slug, else derive from
        // the object key.
        const derived = file.name.slice(prefix.length).replace(/\.md$/, '');
        const id = String(frontmatter.slug ?? derived);
        if (seen.has(id)) {
          logger.error(`Duplicate post id/slug "${id}" (from ${file.name}) — overwriting.`);
        }
        seen.add(id);

        const data = await parseData({ id, data: { ...frontmatter, slug: id } });
        const rendered = await renderMarkdown(content);
        store.set({ id, data, body: content, rendered, digest: generateDigest(raw) });
      }

      logger.info(`Loaded ${markdown.length} post(s) from gs://${bucket}/${prefix}`);
    },
  };
}
