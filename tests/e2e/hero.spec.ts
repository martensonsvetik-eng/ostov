import { test, expect } from '@playwright/test';

test('первый экран без прокрутки', async ({ page }) => {
  await page.goto('/ostov/');
  for (const sel of ['h1', '[data-hero-sub]', '[data-hero-cta]']) await expect(page.locator(sel)).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('360px без горизонтальной прокрутки', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 }); await page.goto('/ostov/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= 360)).toBe(true);
});

test('текст поверх фото читается', async ({ page }) => {
  await page.goto('/ostov/');
  await expect(page.locator('[data-hero-scrim]')).toBeVisible(); // затемнение под текстом
});

test('360×740: H1, подзаголовок и «Обсудить проект» видны без прокрутки', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/ostov/');
  for (const sel of ['h1', '[data-hero-sub]', '[data-hero-cta]']) await expect(page.locator(sel)).toBeInViewport({ ratio: 1 });
});

for (const [path, title, cta] of [
  ['/ostov/', 'Кухня — это каркас дома', 'Обсудить проект'],
  ['/ostov/en/', 'The kitchen is the frame of the home', 'Discuss your project'],
] as const) {
  test(`копия первого экрана ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveText(title);
    await expect(page.locator('[data-hero-cta]')).toHaveText(cta);
    await expect(page.locator('[data-hero-cta]')).toHaveAttribute('href', '#contact');
    await expect(page.locator('[data-hero-cta]')).toHaveAttribute('data-variant', 'primary');
    const more = page.locator('[data-hero-more]');
    await expect(more).toHaveAttribute('href', '#projects');
    await expect(more).toHaveAttribute('data-variant', 'link');
  });
}

test('фото первого экрана: AVIF/WebP/JPEG, eager, fetchpriority, preload мобильного варианта', async ({ page }) => {
  await page.goto('/ostov/');
  const img = page.locator('[data-hero-media] img');
  await expect(img).toHaveCount(1);
  await expect(img).toHaveAttribute('loading', 'eager');
  await expect(img).toHaveAttribute('fetchpriority', 'high');
  await expect(img).toHaveAttribute('alt', /.+/);
  await expect(img).toHaveAttribute('width', /\d+/);
  await expect(img).toHaveAttribute('height', /\d+/);
  const types = await page.locator('[data-hero-media] source').evaluateAll((els) => els.map((e) => e.getAttribute('type')));
  expect(types).toEqual(expect.arrayContaining(['image/avif', 'image/webp']));
  const srcsets = await page.locator('[data-hero-media] source').evaluateAll((els) => els.map((e) => e.getAttribute('srcset') ?? ''));
  for (const s of srcsets) expect(s.split(',').length).toBeGreaterThanOrEqual(3);
  const preload = page.locator('head link[rel="preload"][as="image"]');
  await expect(preload).toHaveCount(1);
  await expect(preload).toHaveAttribute('media', /max-width/);
  await expect(preload).toHaveAttribute('imagesrcset', /\d+w/);
  await expect(preload).toHaveAttribute('fetchpriority', 'high');
  expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
});

test('полоса фактов: четыре пункта', async ({ page }) => {
  await page.goto('/ostov/');
  const items = page.locator('[data-facts] li');
  await expect(items).toHaveCount(4);
  await expect(items.first()).toContainText('Своё производство');
  await expect(items.nth(2)).toContainText('10–14 недель');
});
