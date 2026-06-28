import { defineCollection } from 'astro:content';
import { postSchema } from './content/schema';
import { gcsMarkdownLoader } from './loaders/gcs-markdown';

const posts = defineCollection({
  loader: gcsMarkdownLoader({
    bucket: process.env.GCS_CONTENT_BUCKET ?? 'meatyblog-content',
    prefix: 'posts/',
  }),
  schema: postSchema,
});

export const collections = { posts };
