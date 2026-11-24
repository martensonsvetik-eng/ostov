import { describe, it, expect } from 'vitest';
import { contrastRatio } from '../../src/lib/contrast';
import { SCRIM_RGB, SCRIM_BASE_ALPHA, SCRIM_LOWER_ALPHA, SCRIM_TEXT_ALPHA, composite } from '../../src/lib/hero-scrim';

// Worst case: the photo under the text is pure white.
const white = '#ffffff';
const under = {
  h1: composite(SCRIM_RGB, SCRIM_BASE_ALPHA, white),
  text: composite(SCRIM_RGB, SCRIM_LOWER_ALPHA, composite(SCRIM_RGB, SCRIM_BASE_ALPHA, white)),
};

describe('hero scrim over a white photo', () => {
  it('H1 (large text, 56–88 px) ≥3:1 on the base layer', () => {
    expect(contrastRatio('#f4f1ea', under.h1)).toBeGreaterThanOrEqual(3);
  });
  it('subtitle (#F4F1EA) ≥4.5:1 on both layers', () => {
    expect(contrastRatio('#f4f1ea', under.text)).toBeGreaterThanOrEqual(4.5);
  });
  it('secondary link (.on-dark #C9CFB4) ≥4.5:1 on both layers', () => {
    expect(contrastRatio('#c9cfb4', under.text)).toBeGreaterThanOrEqual(4.5);
  });
  it('SCRIM_TEXT_ALPHA is the stacked alpha of both layers', () => {
    expect(SCRIM_TEXT_ALPHA).toBeCloseTo(1 - (1 - SCRIM_BASE_ALPHA) * (1 - SCRIM_LOWER_ALPHA), 6);
    expect(SCRIM_TEXT_ALPHA).toBeGreaterThanOrEqual(0.8);
  });
  it('composite blends in sRGB', () => {
    expect(composite('#000000', 0.5, white)).toBe('#808080');
  });
});
