import { test, expect } from '@playwright/test';

for (const [path, lang, alt] of [['/ostov/', 'ru', 'en'], ['/ostov/en/', 'en', 'ru']] as const) {
  test(`base ${lang}`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator(`link[rel="alternate"][hreflang="${alt}"]`)).toHaveCount(1);
    await expect(page.locator('a.skip-link')).toBeAttached();
    await expect(page.locator('h1')).toHaveCount(1);
  });
}
