// Prune orphaned original images from the build output (MEAT-41).
//
// Astro emits the *source* file of every image imported via the content
// collection `image()` helper and used through `<Image>`/`getImage()` (hero +
// OG images) into `dist/_astro/`, even when every actual usage points at an
// optimized variant. Those originals (often multi-MB) end up referenced by zero
// HTML and just bloat the deploy. Markdown body images don't have this problem.
//
// This step scans the built output for which `_astro` assets are actually
// referenced, then deletes unreferenced RASTER originals only. It never touches
// JS/CSS/font assets (which can be referenced dynamically), so it's safe to run
// unconditionally after `astro build`.
import { readdir, readFile, stat, unlink } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

const DIST = 'dist';
const ASSET_DIR = join(DIST, '_astro');
// Only ever prune image originals — never JS/CSS/fonts/etc.
const RASTER = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.tiff']);
// Scan these for references (HTML for <img>/srcset/meta, CSS for url()).
const REF_EXT = new Set(['.html', '.css']);

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out; // dir missing — nothing to do
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const all = await walk(DIST);

// Collect every basename referenced by any HTML/CSS file. Substring match on the
// basename catches src, srcset, CSS url(), and og:image meta alike.
const refText = (
  await Promise.all(
    all
      .filter((f) => REF_EXT.has(extname(f).toLowerCase()))
      .map((f) => readFile(f, 'utf8'))
  )
).join('\n');

const assets = all.filter(
  (f) => f.startsWith(ASSET_DIR) && RASTER.has(extname(f).toLowerCase())
);

let pruned = 0;
let bytes = 0;
for (const asset of assets) {
  const name = basename(asset);
  if (refText.includes(name)) continue; // referenced — keep
  const { size } = await stat(asset);
  await unlink(asset);
  pruned += 1;
  bytes += size;
  console.log(`  pruned orphan original: _astro/${name} (${(size / 1024).toFixed(0)} kB)`);
}

console.log(
  pruned === 0
    ? 'prune-orphan-assets: no orphaned originals found.'
    : `prune-orphan-assets: removed ${pruned} orphan original(s), reclaimed ${(bytes / 1024 / 1024).toFixed(1)} MB.`
);
