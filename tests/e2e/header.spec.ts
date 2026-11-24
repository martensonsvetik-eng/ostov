import { test, expect } from '@playwright/test';

const isMobile = (name: string) => name === 'mobile';

test('шапка закреплена при прокрутке', async ({ page }) => {
  await page.goto('/ostov/');
  await page.evaluate(() => window.scrollTo(0, 900));
  const top = await page.locator('header.site-header').evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBe(0);
});

test('на телефоне шапка не выше 64 px', async ({ page }, info) => {
  test.skip(!isMobile(info.project.name));
  await page.goto('/ostov/');
  const box = (await page.locator('header.site-header').boundingBox())!;
  expect(box.height).toBeLessThanOrEqual(64);
  await expect(page.locator('.site-header__menu-btn')).toBeVisible();
  await expect(page.locator('.site-header__cta')).toBeVisible();
});

test('меню: открытие, aria-expanded, Esc, клик по якорю', async ({ page }, info) => {
  test.skip(!isMobile(info.project.name));
  await page.goto('/ostov/');
  const btn = page.locator('.site-header__menu-btn');
  const nav = page.locator('#site-menu');
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).toBeHidden();
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(nav).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).toBeHidden();
  await expect(btn).toBeFocused();
  await btn.click();
  await nav.getByRole('link', { name: 'Как мы работаем' }).click();
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  await expect(nav).toBeHidden();
});

test('меню: фокус остаётся внутри, пока меню открыто', async ({ page }, info) => {
  test.skip(!isMobile(info.project.name));
  await page.goto('/ostov/');
  await page.locator('.site-header__menu-btn').click();
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => !!document.activeElement?.closest('header.site-header'));
    expect(inside).toBe(true);
  }
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Shift+Tab');
    const inside = await page.evaluate(() => !!document.activeElement?.closest('header.site-header'));
    expect(inside).toBe(true);
  }
});

test('якорь «Как мы работаем» оставляет раздел ниже шапки', async ({ page }, info) => {
  await page.goto('/ostov/');
  if (isMobile(info.project.name)) await page.locator('.site-header__menu-btn').click();
  await page.locator('#site-menu').getByRole('link', { name: 'Как мы работаем' }).click();
  await expect(page).toHaveURL(/#process$/);
  await page.waitForFunction(() => {
    const s = document.getElementById('process')!.getBoundingClientRect().top;
    return Math.abs(s - document.querySelector('header.site-header')!.getBoundingClientRect().height) < 2;
  });
  const h = (await page.locator('header.site-header').boundingBox())!.height;
  const top = await page.locator('#process').evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(h - 1);
  await expect(page.locator('#process')).toBeInViewport();
});

test('якорь при reduce motion прокручивает мгновенно', async ({ browser }, info) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: info.project.use.viewport! });
  const page = await ctx.newPage();
  await page.goto('/ostov/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await ctx.close();
});

test('переключение языка сохраняет якорь', async ({ page }, info) => {
  await page.goto('/ostov/#process');
  if (isMobile(info.project.name)) await page.locator('.site-header__menu-btn').click();
  await page.locator('#site-menu').getByRole('link', { name: 'EN' }).click();
  await expect(page).toHaveURL(/\/ostov\/en\/#process$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  if (isMobile(info.project.name)) await page.locator('.site-header__menu-btn').click();
  await page.locator('#site-menu').getByRole('link', { name: 'RU' }).click();
  await expect(page).toHaveURL(/\/ostov\/#process$/);
});

test('кнопка «Обсудить проект» ведёт к #contact', async ({ page }, info) => {
  await page.goto('/ostov/');
  const cta = page.locator('.site-header__cta');
  await expect(cta).toHaveAttribute('href', '#contact');
  if (!isMobile(info.project.name)) await expect(cta).toContainText('Обсудить проект');
  await cta.click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.locator('#contact')).toBeInViewport();
});

test('текущий раздел подсвечен в навигации', async ({ page }, info) => {
  test.skip(isMobile(info.project.name));
  await page.goto('/ostov/#process');
  const link = page.locator('#site-menu a[href="#process"]');
  await expect(link).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#site-menu a[href="#collections"]')).not.toHaveAttribute('aria-current', 'true');
});

test('английская версия: шапка и подписи', async ({ page }) => {
  await page.goto('/ostov/en/');
  await expect(page.locator('.site-header__cta')).toHaveAttribute('href', '#contact');
  await expect(page.locator('.site-header__logo')).toHaveAttribute('aria-label', 'OSTOV');
  await expect(page.locator('h1')).toHaveCount(1);
});

test.describe('шапка: уменьшение движения', () => {
  test.use({ reducedMotion: 'reduce' });
  test('в шапке ничто не анимируется', async ({ page }, info) => {
    await page.goto('/ostov/');
    if (isMobile(info.project.name)) await page.locator('.site-header__menu-btn').click();
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll('header.site-header, header.site-header *')].filter((el) => {
        const s = getComputedStyle(el);
        const d = s.transitionDuration.split(',').some((v) => parseFloat(v) > 0);
        return d || (s.animationName !== 'none' && parseFloat(s.animationDuration) > 0);
      }).length,
    );
    expect(bad).toBe(0);
  });
});
