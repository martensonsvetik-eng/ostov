import { describe, it, expect } from 'vitest';
import { logoPaths } from '../../src/components/sections/logo-paths';

describe('logo paths', () => {
  for (const lang of ['ru', 'en'] as const) {
    it(`${lang}: only valid path tokens, no NaN`, () => {
      const { d, w } = logoPaths[lang];
      expect(d).not.toMatch(/NaN|undefined|Infinity/);
      expect(d.replace(/[MLQCZ\d.\-\s]/g, '')).toBe('');
      expect(d.startsWith('M')).toBe(true);
      expect(w).toBeGreaterThan(80);
    });
  }
});
