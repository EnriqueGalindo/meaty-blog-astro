// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

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
  // Self-hosted webfonts via Astro's native Fonts API (MEAT-23/D3). Maps the 4
  // D1 type roles (tokens.css) to Fontsource families. Fonts are downloaded at
  // build, served from /_astro/fonts, and get metric-optimized fallbacks +
  // `font-display: swap` (default). Per-family `fallbacks` ends in the generic
  // that matches the family's metrics (the optimized fallback is built from it),
  // mirroring the system stacks in tokens.css. `styles` is pinned to ["normal"]
  // (default is ["normal","italic"]) so only the italic we use — Bitter 400 — is
  // fetched, via its own granular entry. Used weights only; extend in D4–D6.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Oswald',
      cssVariable: '--font-oswald',
      weights: [500, 600, 700],
      styles: ['normal'],
      fallbacks: ['Arial Narrow', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Bitter',
      cssVariable: '--font-bitter',
      weights: [400, 700],
      styles: ['normal'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      // Bitter italic — the hero tagline only (400); separate entry keeps it off
      // every other weight.
      provider: fontProviders.fontsource(),
      name: 'Bitter',
      cssVariable: '--font-bitter',
      weights: [400],
      styles: ['italic'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      weights: [400],
      styles: ['normal'],
      fallbacks: ['monospace'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Caveat',
      cssVariable: '--font-caveat',
      weights: [400, 600],
      styles: ['normal'],
      fallbacks: ['cursive'],
    },
  ],
});
