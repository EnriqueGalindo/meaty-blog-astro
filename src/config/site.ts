// Site / author config — the single source of truth for non-post site content
// (MEAT-43). Authored fresh for the relaunch (supersedes the legacy Contentful
// singletons migrated in B4/MEAT-15). UI components read from here; this module
// owns the values, not the rendering.
//
// The author photo is imported so Astro's image pipeline optimizes it when a
// component renders it (the bio section lands in MEAT-47/D6.1); importing it
// here just stages the asset + metadata.
import type { ImageMetadata } from 'astro';
import authorPhoto from '../assets/enrique-galindo.jpg';

export interface SiteConfig {
  /** Brand name — <title> suffix, og:site_name, header/footer wordmark. */
  title: string;
  /** Default meta description / og:description for the site. */
  description: string;
  /** Loose topic keywords (low SEO weight; emitted as <meta name="keywords">). */
  keywords: readonly string[];
  /** Canonical origin; mirrors Astro `site` in astro.config.mjs. */
  url: string;
  /** "EST." year shown in the brand lockup. */
  est: number;
  author: {
    name: string;
    role: string;
    /** Bio paragraphs (rendered by the author section, MEAT-47). */
    bio: readonly string[];
    photo: ImageMetadata;
  };
  hero: {
    title: string;
    /** Optional one-line standfirst under the hero title. */
    tagline?: string;
  };
}

export const site: SiteConfig = {
  title: 'Meaty Blog',
  description:
    'Data engineering, self-hosting, and taking back control of your data — getting into the meat of it.',
  keywords: ['data engineering', 'self-hosting', 'home lab', 'data ownership', 'privacy', 'databricks'],
  url: 'https://meaty.blog',
  est: 2022,
  author: {
    name: 'Enrique Galindo',
    role: 'Data architect · Indiana Pacers',
    bio: [
      "I'm Enrique — a data architect with the Indiana Pacers. I've spent the last four years working with sports-business data, currently in a mostly Databricks-focused environment.",
      'I write here about data engineering, self-hosting, reclaiming ownership of your data, and anything else that strikes my fancy.',
    ],
    photo: authorPhoto,
  },
  hero: {
    title: 'Getting into the meat of it.',
  },
};
