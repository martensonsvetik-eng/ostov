/**
 * Questionnaire draft stored in sessionStorage only (never localStorage or network).
 * Storage can throw (quota exceeded, SecurityError when storage is blocked, even on
 * reading the `sessionStorage` property itself): every call is guarded, so a broken
 * storage only means "no draft" and never breaks the form.
 */
export type DraftData = Record<string, string | string[]>;

const KEY = 'ostov:questionnaire';

function storage(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function saveDraft(data: DraftData): void {
  try {
    storage()?.setItem(KEY, JSON.stringify(data));
  } catch {
    /* no draft this time */
  }
}

export function loadDraft(): DraftData | null {
  try {
    const raw = storage()?.getItem(KEY) ?? null;
    if (raw === null) return null;
    const data: unknown = JSON.parse(raw);
    return data && typeof data === 'object' && !Array.isArray(data) ? (data as DraftData) : null;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    storage()?.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
