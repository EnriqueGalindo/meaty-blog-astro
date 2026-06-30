/**
 * Estimated reading time in whole minutes (MEAT-45 / D9).
 *
 * Computed at build time from the post's raw Markdown `body` (no schema field).
 * Counts whitespace-delimited tokens at 200 wpm, rounded up, min 1 — an
 * approximation (Markdown syntax/image refs count as words), which is fine for a
 * menu-board "X MIN READ" estimate.
 */
const WORDS_PER_MINUTE = 200;

export function readingTimeMinutes(body: string | undefined): number {
  const words = body?.match(/\S+/g)?.length ?? 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
