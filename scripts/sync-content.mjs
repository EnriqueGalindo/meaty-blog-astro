// Build-time content sync: private GCS -> local co-located folders (MEAT-41).
//
// GCS stays the content source of truth. This step materializes it locally so
// Astro's native sharp pipeline can optimize images the standard way:
//   gs://<bucket>/posts/<slug>.md         -> src/content/posts/<slug>/index.md
//   gs://<bucket>/assets-src/<file>       -> src/content/posts/<slug>/<file>
//
// Image refs in the source markdown are absolute public-bucket URLs
// (https://storage.googleapis.com/<bucket>/images/<file>) — a path that is NOT
// publicly served (org-wide PAP, see MEAT-19). We rewrite them to co-located
// `./<file>` refs in-memory so `image()` + Markdown `![]()` resolve locally.
// (The GCS source can be rewritten separately for MEAT-12; this sync does not
// depend on that having happened.)
//
// Auth is keyless via Application Default Credentials: local dev uses
// `gcloud auth application-default login`; CI uses Workload Identity Federation.
//
// Fail-loud by design: any missing object, unknown image, or empty result
// throws non-zero so a broken sync can never ship a blank/partial site.
import { Storage } from '@google-cloud/storage';
import matter from 'gray-matter';
import { readFile, rm, mkdir, writeFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUCKET = process.env.GCS_CONTENT_BUCKET ?? 'meatyblog-content';
const PROJECT_ID = process.env.GCS_PROJECT_ID ?? 'meatyblog';
const POSTS_PREFIX = 'posts/';
const IMAGES_PREFIX = 'assets-src/';
const DEST = join(ROOT, 'src/content/posts');
const TMP = join(ROOT, 'src/content/.posts.tmp');
const MANIFEST = join(ROOT, 'migration/asset-manifest.json');

// Public-bucket URL prefix the source markdown uses for images. Rewritten to
// co-located `./` refs. Tolerate an optional trailing-slash-less variant.
const IMG_URL_PREFIX = `https://storage.googleapis.com/${BUCKET}/images/`;

// `pnpm dev --if-missing`-style fast path: skip the GCS round-trip when content
// is already materialized (warm dev restarts). Build/CI always run a full sync.
if (process.argv.includes('--if-missing') && existsSync(DEST)) {
  const { readdirSync } = await import('node:fs');
  if (readdirSync(DEST).length > 0) {
    console.log('sync-content: content already present — skipping (--if-missing).');
    process.exit(0);
  }
}

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
// Filenames the migration marked as actually referenced — our validation set.
const referenced = new Map(
  manifest.filter((m) => m.status === 'referenced').map((m) => [m.filename, m])
);

const storage = new Storage({ projectId: PROJECT_ID });
const bucket = storage.bucket(BUCKET);

console.log(`sync-content: reading gs://${BUCKET}/${POSTS_PREFIX}`);
let mdFiles;
try {
  const [files] = await bucket.getFiles({ prefix: POSTS_PREFIX });
  mdFiles = files.filter((f) => f.name.endsWith('.md'));
} catch (e) {
  // Missing creds / no access MUST throw — never resolve to an empty site.
  throw new Error(`Failed to list gs://${BUCKET}/${POSTS_PREFIX}: ${e.message}`);
}

if (mdFiles.length === 0) {
  throw new Error(`No markdown found under gs://${BUCKET}/${POSTS_PREFIX} — refusing to build a blank site.`);
}

const basename = (u) => String(u).split('/').pop();
const slugs = new Set();
let imageCount = 0;

await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });

for (const file of mdFiles) {
  const [buf] = await file.download();
  const raw = buf.toString('utf8');
  const { data } = matter(raw);

  const slug = String(data.slug ?? '').trim();
  if (!slug) throw new Error(`${file.name}: missing frontmatter \`slug\`.`);
  if (slugs.has(slug)) throw new Error(`Duplicate slug "${slug}" (from ${file.name}).`);
  slugs.add(slug);

  // Collect every referenced image (frontmatter hero/og + body) BEFORE rewrite.
  const bodyRefs = [...raw.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
  const refs = [data.heroImage, data.ogImage, ...bodyRefs].filter(Boolean).map(basename);
  const uniqueRefs = [...new Set(refs)];

  // Rewrite the public-bucket image URLs to co-located `./` refs, verbatim
  // otherwise (no frontmatter reformatting — preserves dates/quoting as-is).
  const normalized = raw.split(IMG_URL_PREFIX).join('./');

  const postDir = join(TMP, slug);
  await mkdir(postDir, { recursive: true });
  await writeFile(join(postDir, 'index.md'), normalized, 'utf8');

  for (const name of uniqueRefs) {
    if (!referenced.has(name)) {
      throw new Error(`${file.name}: image "${name}" is not a referenced asset in the manifest.`);
    }
    const obj = bucket.file(IMAGES_PREFIX + name);
    const [exists] = await obj.exists();
    if (!exists) {
      throw new Error(`${file.name}: image "${name}" not found at gs://${BUCKET}/${IMAGES_PREFIX}${name}.`);
    }
    await obj.download({ destination: join(postDir, name) });
    imageCount += 1;
  }

  console.log(`  ${slug}: index.md + ${uniqueRefs.length} image(s)`);
}

// Atomic swap: replace the live dir only after the full set is validated.
await rm(DEST, { recursive: true, force: true });
await rename(TMP, DEST);

console.log(`sync-content: ${slugs.size} post(s), ${imageCount} image(s) synced to src/content/posts/.`);
