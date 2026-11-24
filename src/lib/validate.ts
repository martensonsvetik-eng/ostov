/** Error keys; the texts live in the i18n dictionaries under `forms.errors.<key>`. */
export type FieldError =
  | 'required'
  | 'tooShort'
  | 'tooLong'
  | 'phoneDigits'
  | 'phoneChars'
  | 'email'
  | 'consent'
  | 'choice';

export type Rule = 'name' | 'phone' | 'email' | 'consent' | 'choice' | 'text' | 'optional';

const NAME_MIN = 2;
const NAME_MAX = 60;
const PHONE_MIN_DIGITS = 10;

export function validateName(v: string): FieldError | null {
  const t = v.trim();
  if (t === '') return 'required';
  const len = [...t].length;
  if (len < NAME_MIN) return 'tooShort';
  if (len > NAME_MAX) return 'tooLong';
  return null;
}

export function validatePhone(v: string): FieldError | null {
  const t = v.trim();
  if (t === '') return 'required';
  // Allowed: digits, spaces, '(', ')', '-', and one '+' at the very start.
  const body = t.startsWith('+') ? t.slice(1) : t;
  if (!/^[\d\s()-]*$/.test(body)) return 'phoneChars';
  const digits = body.replace(/\D/g, '').length;
  if (digits < PHONE_MIN_DIGITS) return 'phoneDigits';
  return null;
}

export function validateEmail(v: string): FieldError | null {
  const t = v.trim();
  if (t === '') return 'required';
  if (/\s/.test(t)) return 'email';
  const parts = t.split('@');
  if (parts.length !== 2) return 'email';
  const [local, domain] = parts as [string, string];
  if (local === '') return 'email';
  const labels = domain.split('.');
  if (labels.length < 2 || labels.some((label) => label === '')) return 'email';
  return null;
}

function text(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value : '';
}

/** Validates FormData against a field-name → rule schema; returns only the fields with errors. */
export function validateForm(
  schema: Record<string, Rule>,
  data: FormData,
): Record<string, FieldError> {
  const errors: Record<string, FieldError> = {};
  for (const [name, rule] of Object.entries(schema)) {
    let error: FieldError | null = null;
    switch (rule) {
      case 'name':
        error = validateName(text(data.get(name)));
        break;
      case 'phone':
        error = validatePhone(text(data.get(name)));
        break;
      case 'email':
        error = validateEmail(text(data.get(name)));
        break;
      case 'consent':
        error = text(data.get(name)) === '' ? 'consent' : null;
        break;
      case 'choice':
        error = data.getAll(name).some((v) => text(v).trim() !== '') ? null : 'choice';
        break;
      case 'text':
        error = text(data.get(name)).trim() === '' ? 'required' : null;
        break;
      case 'optional':
        error = null;
        break;
    }
    if (error) errors[name] = error;
  }
  return errors;
}
