import { test, expect } from 'vitest';
import { ru } from '../../src/i18n/ru'; import { en } from '../../src/i18n/en';
const flat = (o: object, p = ''): Record<string,string> => Object.entries(o).reduce((a,[k,v]) =>
  typeof v === 'string' ? { ...a, [p+k]: v } : { ...a, ...flat(v, p+k+'.') }, {});
test('одинаковые ключи', () => expect(Object.keys(flat(en)).sort()).toEqual(Object.keys(flat(ru)).sort()));
test('нет пустых строк', () => { for (const d of [ru, en]) for (const v of Object.values(flat(d))) expect(v.trim()).not.toBe(''); });
test('ключевые строки', () => {
  expect(ru.hero.title).toBe('Кухни по индивидуальным проектам');
  expect(en.hero.title).toBe('Kitchens made to individual designs');
  expect(ru.footer.rights).toBe('© 2026 ООО «Остов». Все права защищены.');
  expect(en.footer.rights).toBe('© 2026 Ostov LLC. All rights reserved.');
});
test('EN: бюджеты проектов в евро, без ₽', () => {
  const metas = [en.projects.main.meta, ...Object.values(en.projects.cards).map((c) => c.meta)];
  for (const m of metas) {
    const budget = m.split(' · ')[1]!;
    expect(budget).toMatch(/^€\d{2,3} 000$/);
    expect(m).not.toContain('₽');
  }
});

// Решение заказчика 2026-11-24: сайт читается как сайт реальной компании — никаких пометок о демо и концепте.
test('нет видимых пометок о демо, концепте и вымысле', () => {
  const bad = /демо|концепт|вымышл|демонстрац|не отправл|заглушк|реальном проекте|demo|concept|fictional|demonstration|not sent|placeholder|real project/i;
  for (const d of [ru, en]) for (const [k, v] of Object.entries(flat(d))) expect(`${k}: ${v}`).not.toMatch(bad);
});
