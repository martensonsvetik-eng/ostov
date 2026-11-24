import { test, expect, type Page } from '@playwright/test';

/** Блок 8 «Для архитекторов и дизайнеров», подвал, 404, мета для соцсетей (task 13). */

const LANGS = [
  { lang: 'ru', url: '/ostov/', cta: 'Получить доступ к библиотеке', pro: 'Архитектор / дизайнер', rights: '© 2026 ООО «Остов». Все права защищены.', address: 'Москва, Камнерезный проезд, 4', bad: /концепт|вымышл|демо|демонстрац|заглушк/i, home: '/ostov/' },
  { lang: 'en', url: '/ostov/en/', cta: 'Get access to the library', pro: 'Architect / designer', rights: '© 2026 Ostov LLC. All rights reserved.', address: 'Moscow, 4 Kamnereznyy proezd', bad: /concept|fictional|demo|placeholder/i, home: '/ostov/en/' },
];

async function load(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

for (const L of LANGS) {
  test.describe(L.lang, () => {
    test('кнопка доступа к библиотеке ведёт к #contact и выбирает «Архитектор / дизайнер»', async ({ page }) => {
      await load(page, L.url);
      const pro = page.locator('#pro');
      await expect(pro.getByRole('heading', { level: 2 })).toBeVisible();
      await expect(pro.locator('li')).toHaveCount(4);
      await pro.getByRole('link', { name: L.cta }).click();
      await expect(page.locator('#contact-title')).toBeInViewport();
      await expect(page.getByRole('radio', { name: L.pro })).toBeChecked();
      expect(new URL(page.url()).hash).toBe('#contact');
    });

    test('ссылки блока открывают модальные окна образцов и каталога', async ({ page }) => {
      await load(page, L.url);
      await page.locator('#pro [data-open-modal="samples"]').click();
      await expect(page.locator('dialog[data-modal="samples"]')).toBeVisible();
      await page.keyboard.press('Escape');
      await page.locator('#pro [data-open-modal="catalog"]').click();
      await expect(page.locator('dialog[data-modal="catalog"]')).toBeVisible();
    });

    test('подвал: строка © и реквизиты, без пометок о концепте; мессенджеры без логотипов, анкета открывается', async ({ page }) => {
      await load(page, L.url);
      const footer = page.locator('footer');
      await expect(footer.getByText(L.rights, { exact: true })).toBeVisible();
      await expect(footer).toContainText(L.address);
      await expect(footer).toContainText('+7 (495) 000-00-00');
      await expect(footer.locator('a[href^="tel:"]')).toHaveAttribute('href', 'tel:+74950000000');
      await footer.locator('#policy summary').click();
      await expect(footer.locator('#policy p')).toContainText('hello@ostov.example');
      // Решение заказчика 2026-11-24: никаких видимых пометок о демо и концепте на странице.
      expect(await page.locator('body').innerText()).not.toMatch(L.bad);
      // The brand is named once: the logo is decorative, the rights line carries the name.
      await expect(footer.locator('.footer__logo')).toHaveAttribute('aria-hidden', 'true');
      await expect(footer.getByRole('img')).toHaveCount(0);
      await expect(footer.locator('.footer__company')).toBeVisible();
      const fs = await footer.getByText(L.rights, { exact: true }).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(fs).toBeGreaterThanOrEqual(14);
      const msg = footer.locator('[data-messenger]');
      expect(await msg.count()).toBeGreaterThan(0);
      expect(await footer.locator('img').count()).toBe(0);
      const labels = await footer.locator('svg').evaluateAll((els) =>
        els.map((e) => (e.getAttribute('aria-label') ?? '') + (e.querySelector('title')?.textContent ?? '')),
      );
      for (const l of labels) expect(l).not.toMatch(/telegram|whatsapp|viber|vk|max|instagram/i);
      const hrefs = await msg.evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
      for (const h of hrefs) expect(h).not.toMatch(/t\.me|wa\.me|viber|vk\.com/i);
      await footer.locator('[data-open-modal="questionnaire"]').click();
      await expect(page.locator('dialog[data-modal="questionnaire"]')).toBeVisible();
    });

    test('og и meta на странице', async ({ page }) => {
      await load(page, L.url);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /ОСТОВ|OSTOV/);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', new RegExp(`og-${L.lang}\.jpg$`));
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /.+/);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
      await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /favicon\.svg$/);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    });
  });
}

test('заголовок «Архитекторам» в шапке ведёт к #pro', async ({ page }) => {
  await load(page, '/ostov/');
  expect(await page.locator('header a[href$="#pro"]').count()).toBeGreaterThan(0);
  expect(await page.locator('#pro').count()).toBe(1);
});

test('404 со ссылкой на главную', async ({ page }) => {
  const res = await page.goto('/ostov/nope');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const home = page.locator('main a[href="/ostov/"]');
  await expect(home).toBeVisible();
  await home.click();
  await expect(page).toHaveURL(/\/ostov\/$/);
});

test('robots.txt, sitemap без /ui/, og-картинки и favicon доступны', async ({ request }) => {
  const robots = await request.get('/ostov/robots.txt');
  expect(robots.ok()).toBe(true);
  const robotsTxt = await robots.text();
  expect(robotsTxt).toContain('Disallow: /');
  expect(robotsTxt).toMatch(/^Sitemap: https?:\/\/\S+\/ostov\/sitemap-index\.xml$/m);
  const sm = await request.get('/ostov/sitemap-index.xml');
  expect(sm.ok()).toBe(true);
  const sm0 = await (await request.get('/ostov/sitemap-0.xml')).text();
  expect(sm0).not.toContain('/ui/');
  expect(sm0).toContain('/ostov/en/');
  for (const f of ['og-ru.jpg', 'og-en.jpg', 'favicon.svg']) {
    expect((await request.get(`/ostov/${f}`)).ok(), f).toBe(true);
  }
});
