import { test, expect } from 'vitest';
import { validateName, validatePhone, validateEmail, validateForm } from '../../src/lib/validate';

test.each([['Ан', null], ['А', 'tooShort'], ['  ', 'required'], ['А'.repeat(61), 'tooLong']])('name %s', (v, e) => expect(validateName(v)).toBe(e));
test.each([
  ['+7 (916) 123-45-67', null], ['8 916 123 45 67', null], ['89161234567', null],
  ['916123456', 'phoneDigits'], ['+7 916 abc 45 67', 'phoneChars'], ['', 'required'], ['7++9161234567', 'phoneChars'],
])('phone %s', (v, e) => expect(validatePhone(v)).toBe(e));
test.each([['a@b.ru', null], ['a@b', 'email'], ['', 'required']])('email %s', (v, e) => expect(validateEmail(v)).toBe(e));
test('consent обязателен', () => {
  const fd = new FormData(); fd.set('name', 'Анна'); fd.set('phone', '+7 916 123 45 67');
  expect(validateForm({ name: 'name', phone: 'phone', consent: 'consent' }, fd)).toEqual({ consent: 'consent' });
});
