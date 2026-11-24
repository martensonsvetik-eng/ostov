import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('ui-кит: состояния и axe', async ({ page }) => {
  await page.goto('/ostov/ui/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  for (const s of ['primary', 'secondary', 'link']) await expect(page.locator(`[data-variant="${s}"]`).first()).toBeVisible();
  await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
  const r = await new AxeBuilder({ page }).analyze();
  expect(r.violations.filter((v) => ['critical', 'serious'].includes(v.impact!))).toEqual([]);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('600 40px "Cormorant Garamond"', 'Ж'))).toBe(true);
});

test('ui-кит: поле с ошибкой связано с текстом ошибки', async ({ page }) => {
  await page.goto('/ostov/ui/');
  const invalid = page.locator('input[aria-invalid="true"]').first();
  const ids = (await invalid.getAttribute('aria-describedby'))!.split(/\s+/);
  const texts = await Promise.all(ids.map((id) => page.locator(`#${id}`).innerText()));
  expect(texts.join(' ')).toContain('не меньше 10 цифр');
  // у каждого поля есть видимая подпись
  for (const input of await page.locator('.field input').all()) {
    const id = await input.getAttribute('id');
    await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
  }
});

test('ui-кит: кнопки — загрузка, неактивная, зона нажатия ≥ 44×44', async ({ page }) => {
  await page.goto('/ostov/ui/');
  const loading = page.locator('button[aria-busy="true"]').first();
  await expect(loading).toBeDisabled();
  await expect(page.locator('button[data-variant][disabled]:not([aria-busy])').first()).toBeAttached();
  await expect(page.locator('a[data-variant="link"][href]').first()).toBeVisible();
  for (const el of await page.locator('[data-variant]').all()) {
    const box = (await el.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

test('ui-кит: фокус с клавиатуры даёт рамку ≥ 2px', async ({ page }) => {
  await page.goto('/ostov/ui/');
  await page.keyboard.press('Tab');
  const skip = page.locator('a.skip-link');
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.locator('button[data-variant="primary"]:not([disabled])').first().focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  const w = await page.evaluate(() => parseFloat(getComputedStyle(document.activeElement!).outlineWidth));
  expect(w).toBeGreaterThanOrEqual(2);
});

test('ui-кит: группы выбора — radiogroup и флажки', async ({ page }) => {
  await page.goto('/ostov/ui/');
  await expect(page.locator('fieldset input[type="radio"]').first()).toBeChecked();
  await expect(page.locator('fieldset input[type="checkbox"]').first()).toBeAttached();
  await expect(page.locator('fieldset legend').first()).toBeVisible();
});
