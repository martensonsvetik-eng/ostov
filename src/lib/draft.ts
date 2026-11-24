/**
 * Questionnaire draft stored in sessionStorage only (never localStorage or network).
 */
export type DraftData = Record<string, string | string[]>;

const KEY = 'ostov:questionnaire';

function storage(): Storage | null {
  return typeof sessionStorage === 'undefined' ? null : sessionStorage;
}

export function saveDraft(data: DraftData): void {
  storage()?.setItem(KEY, JSON.stringify(data));
}

export function loadDraft(): DraftData | null {
  const store = storage();
  if (!store) return null;
  const raw = store.getItem(KEY);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as DraftData;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  storage()?.removeItem(KEY);
}
