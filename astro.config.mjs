// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  image: {
    // Hero/OG images are remote URLs (MEAT-17). Authorize the GCS host so the
    // image pipeline (MEAT-19) can optimize them. Note: images must be served
    // from a PUBLICLY readable path — the private content bucket would 403.
    domains: ['storage.googleapis.com'],
  },
});
