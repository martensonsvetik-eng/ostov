import { test, expect } from 'vitest';
import { ru } from '../../src/i18n/ru'; import { en } from '../../src/i18n/en';
const flat = (o: object, p = ''): Record<string,string> => Object.entries(o).reduce((a,[k,v]) =>
  typeof v === 'string' ? { ...a, [p+k]: v } : { ...a, ...flat(v, p+k+'.') }, {});
test('одинаковые ключи', () => expect(Object.keys(flat(en)).sort()).toEqual(Object.keys(flat(ru)).sort()));
test('нет пустых строк', () => { for (const d of [ru, en]) for (const v of Object.values(flat(d))) expect(v.trim()).not.toBe(''); });
test('ключевые строки', () => {
  expect(ru.hero.title).toBe('Кухня — это каркас дома');
  expect(en.hero.title).toBe('The kitchen is the frame of the home');
  expect(ru.forms.demoNote).toBe('Демо-форма: данные никуда не отправляются');
  expect(en.forms.demoNote).toBe('Demo form: no data is sent');
});
