// Brand raster asset generator (MEAT-22 / D2).
//
// Rasterizes the D1 brand SVG masters in `public/brand/` into the favicon set,
// app icons, and the default OG card. Run manually after the brand changes —
// this is NOT part of `pnpm build`; the generated binaries are committed.
//
//   node scripts/gen-brand-assets.mjs
//
// Uses the existing `sharp` dep only (no new packages); the multi-size .ico is
// packed by a tiny inline encoder below.
//
// OG FONT REQUIREMENT: `og-default.svg` has live Oswald + Bitter text. The
// generator points fontconfig at a local font dir (scripts/.fonts, gitignored)
// and fails loudly if the required faces are missing. Fetch them first:
//
//   mkdir -p scripts/.fonts && cd scripts/.fonts
//   curl -fsSLO https://unpkg.com/@expo-google-fonts/oswald/Oswald_600SemiBold.ttf
//   curl -fsSLO https://unpkg.com/@expo-google-fonts/oswald/Oswald_700Bold.ttf
//   curl -fsSLO https://unpkg.com/@expo-google-fonts/bitter/Bitter_400Regular_Italic.ttf
//
// The committed artifact is the PNG, so there is no build/CI font dependency.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUB = join(ROOT, 'public');
const BRAND = join(PUB, 'brand');
const ICONS = join(PUB, 'icons');
const FONT_DIR = join(__dirname, '.fonts');

// Brand palette (src/styles/tokens.css).
const PAPER = '#f4ece0';

// --- font setup: make the local TTFs discoverable by sharp's fontconfig -------
// A minimal fontconfig file that adds our font dir; FONTCONFIG_FILE must be set
// BEFORE sharp/libvips initializes, so we do it at the top of this module.
function setupFonts() {
  const needed = ['Oswald_600SemiBold.ttf', 'Oswald_700Bold.ttf', 'Bitter_400Regular_Italic.ttf'];
  const have = existsSync(FONT_DIR) ? readdirSync(FONT_DIR) : [];
  const missing = needed.filter((f) => !have.includes(f));
  if (missing.length) {
    console.error(
      `\n✗ Missing OG fonts in ${FONT_DIR}:\n  ${missing.join('\n  ')}\n` +
        `  See the header of this script for the curl commands to fetch them.\n`,
    );
    process.exit(1);
  }
  const confPath = join(FONT_DIR, 'fonts.conf');
  writeFileSync(
    confPath,
    `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FONT_DIR}</dir>
  <cachedir>${join(FONT_DIR, 'cache')}</cachedir>
  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>
</fontconfig>`,
  );
  process.env.FONTCONFIG_FILE = confPath;
}
setupFonts();

// sharp is imported AFTER fontconfig env is set so libvips picks it up.
const { default: sharp } = await import('sharp');

// --- helpers ------------------------------------------------------------------

// Rasterize a square SVG (viewBox 0 0 vb vb) to a transparent PNG of `size`px,
// rendering the SVG at high density first so upscaled icons stay crisp.
function rasterSquare(svgPath, size, vb = 120) {
  const density = Math.ceil((size / vb) * 96);
  return sharp(svgPath, { density }).resize(size, size, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
}

// Logo on a solid paper tile (app icons must not be transparent — iOS fills
// transparent touch icons with black). `scale` is the logo size vs the tile.
async function paperIcon(size, scale) {
  const inner = Math.round(size * scale);
  const logo = await rasterSquare(join(BRAND, 'logo-icon.svg'), inner).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: PAPER },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png();
}

// Minimal multi-size ICO encoder (PNG-in-ICO; supported by all modern browsers).
// entries: [{ size, buf }] where buf is a PNG Buffer.
function encodeIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  const payloads = [];
  entries.forEach((e, i) => {
    const o = i * 16;
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 0); // width (0 => 256)
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, o + 1); // height
    dir.writeUInt8(0, o + 2); // palette
    dir.writeUInt8(0, o + 3); // reserved
    dir.writeUInt16LE(1, o + 4); // color planes
    dir.writeUInt16LE(32, o + 6); // bits per pixel
    dir.writeUInt32LE(e.buf.length, o + 8); // size of payload
    dir.writeUInt32LE(offset, o + 12); // offset
    offset += e.buf.length;
    payloads.push(e.buf);
  });
  return Buffer.concat([header, dir, ...payloads]);
}

// --- generate -----------------------------------------------------------------

mkdirSync(ICONS, { recursive: true });
const wrote = [];
const save = (rel, buf) => {
  writeFileSync(join(PUB, rel), buf);
  wrote.push(`${rel} (${buf.length.toLocaleString()} B)`);
};

// favicon.ico — 16/32/48 from the tab-optimized favicon.svg (transparent).
const icoSizes = [16, 32, 48];
const icoEntries = [];
for (const s of icoSizes) {
  icoEntries.push({ size: s, buf: await rasterSquare(join(PUB, 'favicon.svg'), s).png().toBuffer() });
}
save('favicon.ico', encodeIco(icoEntries));

// apple-touch-icon — 180, paper tile.
save('apple-touch-icon.png', await (await paperIcon(180, 0.9)).toBuffer());

// PWA app icons — 192/512 "any" + a 512 maskable (more safe-zone padding).
save('icons/icon-192.png', await (await paperIcon(192, 0.9)).toBuffer());
save('icons/icon-512.png', await (await paperIcon(512, 0.9)).toBuffer());
save('icons/icon-512-maskable.png', await (await paperIcon(512, 0.72)).toBuffer());

// Default OG card — 1200×630, rendered at 2× then downscaled. Needs the fonts.
const og = await sharp(join(BRAND, 'og-default.svg'), { density: 192 })
  .resize(1200, 630)
  .png()
  .toBuffer();
save('og-default.png', og);

console.log('Wrote:\n  ' + wrote.join('\n  '));
