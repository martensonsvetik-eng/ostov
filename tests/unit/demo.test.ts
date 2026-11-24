// @vitest-environment jsdom
import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { demoSubmit } from '../../src/lib/demoSubmit';
import { saveDraft, loadDraft, clearDraft } from '../../src/lib/draft';

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test('ok без сети', async () => {
  const spy = vi.spyOn(globalThis, 'fetch');
  await expect(demoSubmit({ delayMs: 0 })).resolves.toBe('ok');
  expect(spy).not.toHaveBeenCalled();
});

test('error по ?demo=error', async () => expect(demoSubmit({ search: '?demo=error', delayMs: 0 })).resolves.toBe('error'));

test('черновик только в sessionStorage', () => {
  saveDraft({ type: 'house' }); expect(loadDraft()).toEqual({ type: 'house' });
  expect(localStorage.length).toBe(0); clearDraft(); expect(loadDraft()).toBeNull();
});

test('демо-отправка по умолчанию ждёт от 800 до 1200 мс', async () => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0);
  const p = demoSubmit({ search: '' });
  let settled = false;
  p.then(() => { settled = true; });
  await vi.advanceTimersByTimeAsync(799);
  expect(settled).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  await expect(p).resolves.toBe('ok');
});

test('loadDraft возвращает null при повреждённом JSON и не бросает', () => {
  sessionStorage.setItem('ostov:questionnaire', '{not json');
  expect(loadDraft()).toBeNull();
});

test('ключ черновика ostov:questionnaire, массивы сохраняются', () => {
  saveDraft({ rooms: ['a', 'b'] });
  expect(sessionStorage.getItem('ostov:questionnaire')).toBe(JSON.stringify({ rooms: ['a', 'b'] }));
  expect(loadDraft()).toEqual({ rooms: ['a', 'b'] });
});
