import { test, expect, type Page } from '@playwright/test';

/** Motion layer (brief.md §6, §9): CSS/IntersectionObserver reveal + desktop-only lazy GSAP parallax. */

const GSAP_URL = /gsap|ScrollTrigger/i;
const style = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const s = getComputedStyle(el);
    return [s.opacity, s.transform];
  });

test.describe('уменьшение движения', () => {
  test.use({ reducedMotion: 'reduce' });

  test('reduced motion: всё сразу видно, без transform', async ({ page }) => {
    await page.goto('/ostov/');
    const s = await page.locator('[data-reveal]').first().evaluate((el) => [getComputedStyle(el).opacity, getComputedStyle(el).transform]);
    expect(s).toEqual(['1', 'none']);
    // Every reveal element, not just the first, and also the ones far below the fold.
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll('[data-reveal]')].filter((el) => {
        const s = getComputedStyle(el);
        return s.opacity !== '1' || s.transform !== 'none';
      }).length,
    );
    expect(hidden).toBe(0);
  });

  test('reduced motion: параллакс не грузится и не двигает фото', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    const urls: string[] = [];
    page.on('request', (r) => urls.push(r.url()));
    await page.goto('/ostov/');
    await page.mouse.wheel(0, 3000);
    await page.locator('#materials').scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');
    expect(urls.some((u) => GSAP_URL.test(u))).toBe(false);
    const moved = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-parallax]')].filter((el) => el.style.transform !== '').length,
    );
    expect(moved).toBe(0);
  });
});

test('на телефоне GSAP не грузится', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile');
  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  await page.goto('/ostov/');
  await page.mouse.wheel(0, 3000);
  await page.waitForLoadState('networkidle');
  expect(urls.some((u) => GSAP_URL.test(u))).toBe(false);
});

test('первый экран не прячется: H1, подзаголовок и CTA видны сразу', async ({ page }) => {
  await page.goto('/ostov/');
  for (const sel of ['h1', '[data-hero-sub]', '[data-hero-cta]']) {
    expect(await style(page, sel)).toEqual(['1', 'none']);
  }
  // Nothing in the first viewport is held back by the reveal.
  const pendingInView = await page.evaluate(() =>
    [...document.querySelectorAll('[data-reveal]')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.top < innerHeight && r.bottom > 0 && getComputedStyle(el).opacity !== '1';
    }).length,
  );
  expect(pendingInView).toBe(0);
});

test('появление при прокрутке: один раз, прозрачность и сдвиг', async ({ page }) => {
  await page.goto('/ostov/');
  const el = page.locator('#materials [data-reveal]').first();
  // Below the fold: held back with opacity and a 16–24 px shift.
  const before = await el.evaluate((n) => {
    const s = getComputedStyle(n);
    return { opacity: s.opacity, y: new DOMMatrix(s.transform).m42, dur: s.transitionDuration, props: s.transitionProperty };
  });
  expect(before.opacity).toBe('0');
  expect(before.y).toBeGreaterThanOrEqual(16);
  expect(before.y).toBeLessThanOrEqual(24);

  await el.scrollIntoViewIfNeeded();
  await expect(el).toHaveClass(/\bis-in\b/);
  const during = await el.evaluate((n) => {
    const s = getComputedStyle(n);
    return { dur: s.transitionDuration.split(',').map((v) => parseFloat(v) * 1000), props: s.transitionProperty };
  });
  for (const d of during.dur) {
    expect(d).toBeGreaterThanOrEqual(400);
    expect(d).toBeLessThanOrEqual(600);
  }
  expect(during.props.split(',').map((p) => p.trim()).sort()).toEqual(['opacity', 'transform']);
  await expect.poll(() => style(page, '#materials [data-reveal]')).toEqual(['1', 'none']);

  // Animated once: scrolling away and back does not hide it again.
  await page.evaluate(() => scrollTo(0, 0));
  await expect(el).toHaveClass(/\bis-in\b/);
  expect(await el.evaluate((n) => getComputedStyle(n).opacity)).toBe('1');
});

test.describe('без JS', () => {
  test.use({ javaScriptEnabled: false });
  test('без JS всё видно', async ({ page }) => {
    await page.goto('/ostov/');
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll('[data-reveal]')].filter((el) => getComputedStyle(el).opacity !== '1').length,
    );
    expect(await page.locator('[data-reveal]').count()).toBeGreaterThan(5);
    expect(hidden).toBe(0);
  });
});

test('коллекции и FAQ: появление не вешается на раскрываемые панели', async ({ page }) => {
  await page.goto('/ostov/');
  expect(await page.locator('[data-collection-panel][data-reveal], [data-collection-panel] [data-reveal]').count()).toBe(0);
  expect(await page.locator('[data-faq-answer][data-reveal], [data-faq-answer] [data-reveal]').count()).toBe(0);
});

test('компьютер: параллакс фото в блоке 4 двигает только transform, GSAP грузится лениво', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  const urls: string[] = [];
  page.on('request', (r) => urls.push(r.url()));
  await page.goto('/ostov/');
  await page.waitForLoadState('networkidle');
  // Lazy: nothing heavy on the first screen until the reader scrolls.
  expect(urls.some((u) => GSAP_URL.test(u))).toBe(false);

  // Hero and block 4 photos are the parallax targets.
  await expect(page.locator('.hero [data-parallax]')).toHaveCount(1);
  await expect(page.locator('#materials [data-parallax]')).toHaveCount(4);

  const img = page.locator('#materials [data-parallax]').first();
  // Layout boxes (offset*) ignore transforms: they must not change when the parallax starts (no CLS).
  const layout = () =>
    page.locator('#materials .material__media').first().evaluate((n) => {
      const el = n as HTMLElement;
      return [el.offsetTop, el.offsetWidth, el.offsetHeight];
    });
  const layout0 = await layout();
  await page.locator('#materials').scrollIntoViewIfNeeded();
  await expect.poll(() => urls.some((u) => GSAP_URL.test(u))).toBe(true);
  await expect.poll(() => img.evaluate((n) => (n as HTMLElement).style.transform), { timeout: 5000 }).not.toBe('');
  const a = await img.evaluate((n) => getComputedStyle(n).transform);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => img.evaluate((n) => getComputedStyle(n).transform)).not.toBe(a);
  expect(await layout()).toEqual(layout0);
  // Only transform is written inline (GSAP also resets the individual translate/rotate/scale to none).
  const inline = await img.evaluate((n) => [...(n as HTMLElement).style].filter((p) => !/^(transform|translate|rotate|scale)$/.test(p)));
  expect(inline).toEqual([]);
});

test('компьютер: при сужении окна параллакс снимается', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/ostov/');
  const img = page.locator('#materials [data-parallax]').first();
  await page.locator('#materials').scrollIntoViewIfNeeded();
  await expect.poll(() => img.evaluate((n) => (n as HTMLElement).style.transform), { timeout: 5000 }).not.toBe('');
  await page.setViewportSize({ width: 800, height: 800 });
  await expect.poll(() => img.evaluate((n) => (n as HTMLElement).style.transform)).toBe('');
  expect(await img.evaluate((n) => getComputedStyle(n).transform)).toBe('none');
});
