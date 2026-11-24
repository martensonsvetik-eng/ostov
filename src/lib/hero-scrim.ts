/**
 * Scrim under the first-screen text (brief.md §6: contrast ≥4.5:1).
 * Two graphite layers, so the photo is darkened only as much as each line needs,
 * even over a pure-white photo (tests/unit/hero-scrim.test.ts):
 * - base layer under the whole text block: enough for the H1 (large text, ≥3:1);
 * - an extra layer under the subtitle and buttons: together ≥4.5:1 for 15–18 px text.
 */
export const SCRIM_RGB = '#24221f';
export const SCRIM_BASE_ALPHA = 0.55;
export const SCRIM_LOWER_ALPHA = 0.56;
/** Effective alpha where both layers overlap (subtitle, buttons). */
export const SCRIM_TEXT_ALPHA = 1 - (1 - SCRIM_BASE_ALPHA) * (1 - SCRIM_LOWER_ALPHA);

/** Alpha-composite `top` at `alpha` over opaque `bottom` in sRGB space; returns #rrggbb. */
export function composite(top: string, alpha: number, bottom: string): string {
  const a = rgb(top);
  const b = rgb(bottom);
  return (
    '#' +
    a
      .map((v, i) => Math.round(v * alpha + b[i]! * (1 - alpha)))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}
