/**
 * Step logic of the questionnaire «Подготовить проект заранее» (brief.md §8.2).
 * Markup: Questionnaire.astro. Checks, loading, success and failure are the shared
 * form.ts (as in §8.1); this file only adds the steps and the draft. Nothing is sent.
 *
 * - One [data-q-step="N"] is shown at a time; the others are `hidden` but NOT disabled,
 *   so the answers of steps 1–4 stay in the FormData of the final submit.
 * - «Далее» is disabled until the current step's required choices are made (REQUIRED);
 *   the full validation runs on submit, on step 5 only.
 * - On «Назад»/«Далее» focus moves to the step heading and an aria-live region
 *   announces «Шаг N из 5. <step>».
 * - Draft: every change is saved to sessionStorage (src/lib/draft.ts, never throws) with
 *   the current step; it is restored on load, so reopening the window or reloading the
 *   tab continues where the visitor left. Consent is never kept. Cleared on success
 *   and on «Заполнить ещё раз».
 */
import { initForm, withName } from './form';
import { saveDraft, loadDraft, clearDraft, type DraftData } from '../lib/draft';
import type { Rule } from '../lib/validate';

const REQUIRED: Record<number, string[]> = {
  1: ['object'],
  2: ['style'],
  3: [],
  4: ['budget', 'term'],
  5: [],
};

/** Steps 1–4 are gated by «Далее»; on submit only the contacts are checked. */
const SCHEMA: Record<string, Rule> = {
  object: 'optional',
  style: 'optional',
  materials: 'optional',
  budget: 'optional',
  term: 'optional',
  name: 'name',
  phone: 'phone',
  method: 'choice',
  meeting: 'choice',
  who: 'choice',
  consent: 'consent',
  newsletter: 'optional',
};

/** Never kept in the draft: consent is given anew each time. */
const NOT_IN_DRAFT = new Set(['consent']);
const STEP_KEY = 'step';

export function initQuestionnaire(form: HTMLFormElement): void {
  const q = <T extends Element>(sel: string) => form.querySelector<T>(sel);
  const steps = [...form.querySelectorAll<HTMLElement>('[data-q-step]')];
  const total = steps.length;
  const progress = q<HTMLElement>('[data-q-progress]');
  const live = q<HTMLElement>('[data-q-live]');
  const segments = [...form.querySelectorAll<HTMLElement>('[data-q-seg]')];
  const back = q<HTMLButtonElement>('[data-q-back]');
  const next = q<HTMLButtonElement>('[data-q-next]');
  const submit = q<HTMLButtonElement>('[data-submit]');
  const stepOf = form.dataset.stepOf ?? '{current}/{total}';
  let current = 1;

  const inputs = () =>
    [...form.elements].filter((el): el is HTMLInputElement => el instanceof HTMLInputElement && el.name !== '');
  const multi = new Set(
    inputs()
      .filter((el) => el.type === 'checkbox')
      .map((el) => el.name)
      .filter((name, _, all) => all.filter((n) => n === name).length > 1),
  );

  const answered = (name: string) =>
    new FormData(form).getAll(name).some((v) => typeof v === 'string' && v.trim() !== '');
  const complete = (n: number) => (REQUIRED[n] ?? []).every(answered);
  const label = (n: number) =>
    stepOf.split('{current}').join(String(n)).split('{total}').join(String(total));
  const heading = (n: number) => steps[n - 1]?.querySelector<HTMLElement>('[data-q-title]') ?? null;

  function syncNext(): void {
    if (next) next.disabled = !complete(current);
  }

  function show(n: number, moveFocus: boolean): void {
    current = Math.min(Math.max(1, n), total);
    for (const s of steps) s.hidden = Number(s.dataset.qStep) !== current;
    if (progress) progress.textContent = label(current);
    segments.forEach((seg, i) => {
      seg.dataset.done = String(i < current);
    });
    if (back) back.hidden = current === 1;
    if (next) next.hidden = current === total;
    if (submit) submit.hidden = current !== total;
    syncNext();
    if (moveFocus) {
      const title = heading(current);
      form.closest('dialog')?.scrollTo({ top: 0 });
      title?.focus({ preventScroll: true });
      if (live) live.textContent = `${label(current)}. ${title?.textContent?.trim() ?? ''}`;
    }
  }

  function collect(): DraftData {
    const out: DraftData = { [STEP_KEY]: String(current) };
    for (const name of multi) if (!NOT_IN_DRAFT.has(name)) out[name] = [];
    for (const [name, value] of new FormData(form)) {
      if (NOT_IN_DRAFT.has(name) || typeof value !== 'string') continue;
      const prev = out[name];
      if (Array.isArray(prev)) prev.push(value);
      else out[name] = value;
    }
    return out;
  }

  const save = () => saveDraft(collect());

  function restore(draft: DraftData): void {
    for (const el of inputs()) {
      if (NOT_IN_DRAFT.has(el.name) || !Object.hasOwn(draft, el.name)) continue;
      const raw = draft[el.name]!;
      const values = Array.isArray(raw) ? raw : [raw];
      if (el.type === 'radio' || el.type === 'checkbox') el.checked = values.includes(el.value);
      else if (typeof raw === 'string') el.value = raw;
    }
    // Continue from the saved step, but never past a step whose required choice is missing.
    let target = Number(draft[STEP_KEY]) || 1;
    for (let n = 1; n < target; n++) {
      if (!complete(n)) {
        target = n;
        break;
      }
    }
    show(target, false);
  }

  // Steps 1–4 never submit (e.g. Enter on an option): only step 5 reaches form.ts.
  // Registered before initForm, so stopImmediatePropagation keeps its handler from running.
  form.addEventListener('submit', (e) => {
    if (current === total) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  });

  next?.addEventListener('click', () => {
    if (!complete(current)) return;
    show(current + 1, true);
    save();
  });
  back?.addEventListener('click', () => {
    show(current - 1, true);
    save();
  });

  form.addEventListener('input', () => {
    syncNext();
    save();
  });
  form.addEventListener('change', () => {
    syncNext();
    save();
  });

  // «Заполнить ещё раз»: form.reset() fires this before the values are reset.
  form.addEventListener('reset', () => {
    clearDraft();
    show(1, false);
    if (live) live.textContent = '';
    setTimeout(syncNext);
  });

  const template = form.dataset.successTemplate ?? '{name}';
  initForm(form, SCHEMA, (data) => {
    clearDraft();
    return `${withName(template, String(data.get('name') ?? '').trim())}.`;
  });

  const draft = loadDraft();
  if (draft) restore(draft);
  else show(1, false);
}
