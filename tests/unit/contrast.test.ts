import { describe, test, expect } from 'vitest';
import { contrastRatio } from '../../src/lib/contrast';

describe('contrastRatio', () => {
  test('пары токенов проходят контраст', () => {
    expect(contrastRatio('#24221F', '#F4F1EA')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#5E5A53', '#F4F1EA')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#FFFFFF', '#4F5B3A')).toBeGreaterThanOrEqual(4.5); // текст основной кнопки
    expect(contrastRatio('#A23B2A', '#FBFAF6')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#F4F1EA', '#24221F')).toBeGreaterThanOrEqual(4.5); // текст на тёмном фоне
  });

  test('известные значения и симметрия', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastRatio('#4F5B3A', '#F4F1EA')).toBeCloseTo(contrastRatio('#F4F1EA', '#4F5B3A'), 10);
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21, 5);
  });

  test('рамка фокуса (акцент) видна на обоих светлых фонах ≥ 3:1', () => {
    expect(contrastRatio('#4F5B3A', '#F4F1EA')).toBeGreaterThanOrEqual(3);
    expect(contrastRatio('#4F5B3A', '#FBFAF6')).toBeGreaterThanOrEqual(3);
  });

  test('некорректный цвет — ошибка', () => {
    expect(() => contrastRatio('red', '#000')).toThrow();
  });
});
