/**
 * Generic demo-form controller (brief.md §8, §8.1). Nothing is ever sent: submit is
 * always prevented and `demoSubmit` only waits 0.8–1.2 s. Shared by the contact form
 * (Task 9) and the catalog, samples and questionnaire forms (Tasks 10–11).
 *
 * Markup contract (all hooks are data-* attributes, nothing is hardcoded per form):
 *   <form data-demo-form novalidate data-state="idle" data-errors='{"required":"…",…}'>
 *     [data-error-summary] hidden, with [data-error-list] <ul> inside   — summary on top
 *     [data-form-body]      fields; hidden on success
 *       [data-error-for="<name>"] > [data-error-text]                  — per-field error
 *       [data-server-error] hidden                                     — ?demo=error message
 *       [data-submit] data-loading-label="…" type="button"             — becomes type=submit
 *     [data-success] hidden > [data-success-title] tabindex=-1, [data-form-reset]
 *   </form>
 * `data-state`: idle | loading | success | error. `data-submit-count` counts real
 * demoSubmit calls (the double-submit guard is tested through it).
 * Validation timing: on blur once the field was edited; after a field's first error —
 * on every input; everything on submit. An untouched empty form is never scolded.
 */
import { validateForm, type FieldError, type Rule } from '../lib/validate';
import { demoSubmit } from '../lib/demoSubmit';

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export type FormState = 'idle' | 'loading' | 'success' | 'error';

/**
 * @param onSuccess receives the submitted data and returns the success heading text
 *   (written with textContent, never as HTML).
 */
export function initForm(
  form: HTMLFormElement,
  schema: Record<string, Rule>,
  onSuccess: (data: FormData) => string,
): void {
  const messages = JSON.parse(form.dataset.errors ?? '{}') as Partial<Record<FieldError, string>>;
  const q = <T extends Element>(sel: string) => form.querySelector<T>(sel);
  const summary = q<HTMLElement>('[data-error-summary]');
  const summaryList = q<HTMLUListElement>('[data-error-list]');
  const body = q<HTMLElement>('[data-form-body]');
  const serverError = q<HTMLElement>('[data-server-error]');
  const success = q<HTMLElement>('[data-success]');
  const successTitle = q<HTMLElement>('[data-success-title]');
  const submit = q<HTMLButtonElement>('[data-submit]');
  const submitLabel = submit?.querySelector<HTMLElement>('.btn__label') ?? submit;
  const idleLabel = submitLabel?.textContent ?? '';
  const names = Object.keys(schema);

  const errors: Record<string, FieldError> = {};
  const dirty = new Set<string>();
  const live = new Set<string>(); // fields re-validated on every input
  let submitted = false;
  let count = 0;

  // JS is here: the button may now submit (without JS it is a plain type="button").
  if (submit) submit.type = 'submit';

  const controls = (name: string): Control[] =>
    [...form.elements].filter((el): el is Control => 'name' in el && (el as Control).name === name);
  const errorBox = (name: string) => form.querySelector<HTMLElement>(`[data-error-for="${CSS.escape(name)}"]`);

  function setState(state: FormState): void {
    form.dataset.state = state;
  }

  function labelOf(name: string): string {
    const el = controls(name)[0];
    if (!el) return name;
    if (el.dataset.summaryLabel) return el.dataset.summaryLabel;
    const group = el.type === 'radio' || (el.type === 'checkbox' && controls(name).length > 1);
    const legend = group ? el.closest('fieldset')?.querySelector('legend') : null;
    const text = legend?.textContent ?? el.labels?.[0]?.textContent ?? name;
    return text.trim();
  }

  function show(name: string, error: FieldError | undefined): void {
    const box = errorBox(name);
    const id = box?.id;
    for (const el of controls(name)) {
      const ids = new Set((el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
      if (error) {
        el.setAttribute('aria-invalid', 'true');
        if (id) ids.add(id);
      } else {
        el.removeAttribute('aria-invalid');
        if (id) ids.delete(id);
      }
      if (ids.size) el.setAttribute('aria-describedby', [...ids].join(' '));
      else el.removeAttribute('aria-describedby');
    }
    if (box) {
      const text = box.querySelector('[data-error-text]') ?? box;
      text.textContent = error ? (messages[error] ?? error) : '';
      box.hidden = !error;
    }
  }

  function check(name: string): void {
    const rule = schema[name];
    if (!rule) return;
    const error = validateForm({ [name]: rule }, new FormData(form))[name];
    if (error) {
      errors[name] = error;
      live.add(name);
    } else {
      delete errors[name];
    }
    show(name, error);
    if (summary && !summary.hidden) renderSummary();
  }

  function focusField(name: string, preventScroll = false): void {
    const els = controls(name);
    const target = els.find((el) => (el as HTMLInputElement).checked) ?? els[0];
    target?.focus({ preventScroll });
  }

  /** Field names with errors, in document order. */
  function invalidInOrder(): string[] {
    const seen: string[] = [];
    for (const el of form.elements) {
      const name = (el as Control).name;
      if (name && errors[name] && !seen.includes(name)) seen.push(name);
    }
    return seen;
  }

  let summaryKey = '';
  function renderSummary(): void {
    if (!summary || !summaryList) return;
    const list = invalidInOrder();
    // Rebuild only when the content changes: re-validation on focusout runs between
    // mousedown and click on a summary link, and replacing it there would eat the click.
    const key = list.map((name) => `${name}:${errors[name]}`).join('|');
    summary.hidden = list.length === 0;
    if (key === summaryKey) return;
    summaryKey = key;
    summaryList.replaceChildren(
      ...list.map((name) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        const first = controls(name)[0];
        a.href = first?.id ? `#${first.id}` : '#';
        a.textContent = `${labelOf(name)}: ${messages[errors[name]!] ?? errors[name]}`;
        a.addEventListener('click', (e) => {
          e.preventDefault();
          focusField(name);
        });
        li.append(a);
        return li;
      }),
    );
  }

  function setLoading(on: boolean): void {
    if (!submit) return;
    submit.disabled = on;
    if (on) submit.setAttribute('aria-busy', 'true');
    else submit.removeAttribute('aria-busy');
    if (submitLabel) submitLabel.textContent = on ? (submit.dataset.loadingLabel ?? idleLabel) : idleLabel;
    let spinner = submit.querySelector<HTMLElement>('.btn__spinner');
    if (on && !spinner) {
      spinner = document.createElement('span');
      spinner.className = 'btn__spinner';
      spinner.setAttribute('aria-hidden', 'true');
      // Carry Astro's style scope (attribute or class strategy) so the Button's spinner CSS applies.
      for (const attr of submit.getAttributeNames()) {
        if (attr.startsWith('data-astro-cid-')) spinner.setAttribute(attr, '');
      }
      for (const cls of submit.classList) if (cls.startsWith('astro-')) spinner.classList.add(cls);
      submit.prepend(spinner);
    } else if (!on) {
      spinner?.remove();
    }
  }

  function clearAll(): void {
    for (const name of names) {
      delete errors[name];
      show(name, undefined);
    }
    live.clear();
    dirty.clear();
    submitted = false;
    if (summary) summary.hidden = true;
    summaryList?.replaceChildren();
    summaryKey = '';
    if (serverError) serverError.hidden = true;
  }

  form.addEventListener('input', (e) => {
    const name = (e.target as Control).name;
    if (!Object.hasOwn(schema, name)) return;
    dirty.add(name);
    if (live.has(name)) check(name);
  });

  // Radios and checkboxes have no meaningful "blur": validate on change once relevant.
  form.addEventListener('change', (e) => {
    const el = e.target as Control;
    if (!Object.hasOwn(schema, el.name)) return;
    if ((el.type === 'radio' || el.type === 'checkbox') && (live.has(el.name) || submitted)) check(el.name);
  });

  form.addEventListener('focusout', (e) => {
    const el = e.target as Control;
    if (!Object.hasOwn(schema, el.name) || el.type === 'radio' || el.type === 'checkbox') return;
    if (dirty.has(el.name) || submitted) check(el.name);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // demo: never navigates, never sends
    if (form.dataset.state === 'loading' || form.dataset.state === 'success') return;
    submitted = true;
    if (serverError) serverError.hidden = true;

    const data = new FormData(form);
    const found = validateForm(schema, data);
    for (const name of names) {
      if (found[name]) {
        errors[name] = found[name];
        live.add(name);
      } else {
        delete errors[name];
      }
      show(name, found[name]);
    }
    renderSummary();
    const first = invalidInOrder()[0];
    if (first) {
      // Keep the summary on screen (under the sticky header) while focus lands on the field.
      const showSummary = summary && !summary.hidden;
      focusField(first, Boolean(showSummary));
      if (showSummary) summary.scrollIntoView({ block: 'start' });
      return;
    }

    setState('loading');
    setLoading(true);
    count += 1;
    form.dataset.submitCount = String(count);
    const result = await demoSubmit();
    setLoading(false);

    if (result === 'error') {
      setState('error');
      if (serverError) {
        serverError.hidden = false;
        serverError.focus();
      }
      return;
    }

    setState('success');
    if (successTitle) successTitle.textContent = onSuccess(data);
    if (body) body.hidden = true;
    if (summary) summary.hidden = true;
    if (success) success.hidden = false;
    successTitle?.focus();
  });

  form.querySelector('[data-form-reset]')?.addEventListener('click', () => {
    form.reset();
    clearAll();
    if (success) success.hidden = true;
    if (body) body.hidden = false;
    setState('idle');
    const first = [...form.elements].find(
      (el): el is Control => 'name' in el && Object.hasOwn(schema, (el as Control).name),
    );
    first?.focus();
  });
}
