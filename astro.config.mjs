// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Absolute base for canonical/OG URLs (MEAT-41). OG image URLs are built as
  // new URL(getImage(...).src, Astro.site).
  site: 'https://meaty.blog',
  image: {
    // Hero + Markdown body images are local files synced from GCS (MEAT-41), so
    // Astro's native sharp pipeline optimizes them — no remote host needed.
    // Global responsive: generates srcset/sizes for <Image> AND Markdown ![]()
    // body images; responsiveStyles adds the small global styles to size them.
    layout: 'constrained',
    responsiveStyles: true,
  },
});
