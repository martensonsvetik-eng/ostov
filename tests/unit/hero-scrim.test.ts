import { describe, it, expect } from 'vitest';
import { contrastRatio } from '../../src/lib/contrast';
import {
  SCRIM_RGB,
  SCRIM_BASE_ALPHA,
  SCRIM_LOWER_ALPHA,
  SCRIM_TEXT_ALPHA,
  LIGHT_RGB,
  LIGHT_ALPHA,
  composite,
  screen,
} from '../../src/lib/hero-scrim';

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

describe('pointer light (desktop) under the scrim', () => {
  const lit = (photo: string) => screen(LIGHT_RGB, LIGHT_ALPHA, photo);
  const onLayers = (photo: string) => ({
    h1: composite(SCRIM_RGB, SCRIM_BASE_ALPHA, lit(photo)),
    text: composite(SCRIM_RGB, SCRIM_LOWER_ALPHA, composite(SCRIM_RGB, SCRIM_BASE_ALPHA, lit(photo))),
  });
  it('screen never brightens past white: the lit worst case is the unlit white photo', () => {
    expect(lit(white)).toBe(white);
    expect(onLayers(white)).toEqual(under);
  });
  it('light is warm and subtle (alpha ≤ 0.2)', () => {
    expect(LIGHT_ALPHA).toBeGreaterThan(0);
    expect(LIGHT_ALPHA).toBeLessThanOrEqual(0.2);
  });
  // Any photo tone under the light: text contrast stays within the white-photo guarantee.
  for (const photo of ['#000000', '#5e5a53', '#9c8f7a', '#d8cbb4', '#f2ede4', '#fefefe']) {
    it(`lit photo ${photo}: H1 ≥3:1, subtitle and link ≥4.5:1`, () => {
      const u = onLayers(photo);
      expect(contrastRatio('#f4f1ea', u.h1)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio('#f4f1ea', u.text)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio('#c9cfb4', u.text)).toBeGreaterThanOrEqual(4.5);
    });
  }
  it('screen blends per channel', () => {
    expect(screen('#ffffff', 1, '#000000')).toBe('#ffffff');
    expect(screen('#000000', 1, '#808080')).toBe('#808080');
    expect(screen('#808080', 1, '#808080')).toBe('#c0c0c0');
  });
});
