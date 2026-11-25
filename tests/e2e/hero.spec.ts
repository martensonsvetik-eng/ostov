import { test, expect, type Page } from '@playwright/test';

/** Waits for the one-off entrance (H1 words, subtitle, actions, photo settle) to finish. */
const heroSettled = (page: Page) =>
  page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => /^hero-(rise|fade|settle)$/.test((a as CSSAnimation).animationName))
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );

test('первый экран без прокрутки', async ({ page }) => {
  await page.goto('/ostov/');
  await heroSettled(page);
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
  await heroSettled(page);
  for (const sel of ['h1', '[data-hero-sub]', '[data-hero-cta]']) await expect(page.locator(sel)).toBeInViewport({ ratio: 1 });
});

for (const [path, title, cta] of [
  ['/ostov/', 'Дизайнерские кухни собственного производства', 'Обсудить проект'],
  ['/ostov/en/', 'Designer kitchens from our own workshop', 'Discuss your project'],
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

/* ---- Living first screen (brief.md §6, «Анимация»): text entrance and morning light ---- */

const ENTER = '.hero__w, [data-hero-sub], [data-hero-cta], [data-hero-more]';
const heroAnims = (page: Page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => ((a.effect as KeyframeEffect).target as Element | null)?.closest('.hero'))
      .map((a) => {
        const t = a.effect!.getComputedTiming();
        return { name: (a as CSSAnimation).animationName ?? '', delay: Number(t.delay), dur: Number(t.duration), end: Number(t.endTime), state: a.playState };
      }),
  );
const restState = (page: Page, sel: string) =>
  page.locator(sel).evaluateAll((els) => els.map((el) => [getComputedStyle(el).opacity, getComputedStyle(el).transform]));

test('появление текста первого экрана: один раз, по очереди, заканчивается в покое; фото не двигается', async ({ page }) => {
  await page.goto('/ostov/');
  const anims = await heroAnims(page);
  // Only the text rises: four H1 words, subtitle, CTA, link. Nothing animates the photo on load.
  expect(anims.every((a) => a.name === 'hero-rise')).toBe(true);
  const rise = anims.sort((a, b) => a.delay - b.delay);
  expect(rise).toHaveLength(4 + 3);
  for (const a of rise) {
    expect(a.dur).toBeGreaterThanOrEqual(600);
    expect(a.dur).toBeLessThanOrEqual(800);
  }
  // Staggered 80–120 ms; starts at once (no wait for idle); all text in place by ~1.5 s.
  for (let i = 1; i < rise.length; i++) {
    expect(rise[i]!.delay - rise[i - 1]!.delay).toBeGreaterThanOrEqual(80);
    expect(rise[i]!.delay - rise[i - 1]!.delay).toBeLessThanOrEqual(120);
  }
  expect(rise[0]!.delay).toBeLessThanOrEqual(100);
  expect(Math.max(...rise.map((a) => a.end))).toBeLessThanOrEqual(1500);
  // Start of the rise: 12–16 px lower and transparent, ease-out.
  const kf = await page.evaluate(() => {
    const a = document.getAnimations().find((x) => (x as CSSAnimation).animationName === 'hero-rise')!;
    const k = (a.effect as KeyframeEffect).getKeyframes()[0]!;
    return { o: k.opacity, y: new DOMMatrix(k.transform as string).m42 };
  });
  expect(Number(kf.o)).toBe(0);
  expect(kf.y).toBeGreaterThanOrEqual(12);
  expect(kf.y).toBeLessThanOrEqual(16);
  // The photo and its <picture> stay put from the first frame.
  for (const v of await restState(page, '[data-hero-media], [data-hero-media] img')) expect(v).toEqual(['1', 'none']);

  await heroSettled(page);
  for (const v of await restState(page, ENTER)) expect(v).toEqual(['1', 'none']);
  // Once: scrolling away and back replays nothing.
  await page.evaluate(() => scrollTo(0, 2000));
  await page.evaluate(() => scrollTo(0, 0));
  expect((await heroAnims(page)).filter((a) => a.name === 'hero-rise' && a.state !== 'finished')).toEqual([]);
  // No layout shift from the entrance (transforms only).
  const cls = await page.evaluate(
    () =>
      new Promise<number>((r) => {
        let sum = 0;
        new PerformanceObserver((l) => {
          for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) sum += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => r(sum), 200);
      }),
  );
  expect(cls).toBeLessThanOrEqual(0.1);
});

test.describe('первый экран: уменьшение движения', () => {
  test.use({ reducedMotion: 'reduce' });
  test('reduced motion: текст виден сразу, без появления и без света', async ({ page }) => {
    await page.goto('/ostov/');
    expect(await heroAnims(page)).toEqual([]);
    for (const v of await restState(page, `${ENTER}, [data-hero-media]`)) expect(v).toEqual(['1', 'none']);
    expect(await page.locator('[data-hero-light]').evaluate((el) => getComputedStyle(el).display)).toBe('none');
    await page.mouse.move(700, 400);
    await page.mouse.move(900, 500, { steps: 3 });
    await page.waitForTimeout(300);
    expect(await page.locator('[data-hero-light]').evaluate((el) => el.getAttribute('style'))).toBeNull();
  });
});

test.describe('первый экран без JS', () => {
  test.use({ javaScriptEnabled: false });
  test('без JS текст первого экрана сразу виден', async ({ page }) => {
    await page.goto('/ostov/');
    for (const v of await restState(page, `${ENTER}, [data-hero-media]`)) expect(v).toEqual(['1', 'none']);
    await expect(page.locator('h1')).toHaveText('Дизайнерские кухни собственного производства');
  });
});

test('утренний свет: следует за курсором над фото, фото не двигается, затем покой', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/ostov/');
  await heroSettled(page);
  const light = page.locator('[data-hero-light]');
  const hero = (await page.locator('.hero').boundingBox())!;
  // Under the scrim/text layer (earlier in the DOM than .hero__body), inert, decorative.
  expect(await light.evaluate((el) => !!(el.compareDocumentPosition(document.querySelector('.hero__body')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  expect(await light.evaluate((el) => [getComputedStyle(el).pointerEvents, getComputedStyle(el).mixBlendMode, el.getAttribute('aria-hidden')])).toEqual(['none', 'screen', 'true']);
  // Clipped by the section: the glow only ever shows over the photo.
  expect(await page.locator('.hero').evaluate((el) => getComputedStyle(el).overflow)).toBe('clip');

  const pos = () =>
    light.evaluate((el) => {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      return { x: m.m41, y: m.m42, o: Number(getComputedStyle(el).opacity) };
    });
  const near = async (p: { x: number; y: number }) => { const q = await pos(); return Math.hypot(q.x - (p.x - hero.x), q.y - (p.y - hero.y)); };

  const p1 = { x: hero.x + hero.width * 0.72, y: hero.y + hero.height * 0.35 };
  await page.mouse.move(p1.x - 40, p1.y);
  await page.mouse.move(p1.x, p1.y, { steps: 4 });
  await expect.poll(async () => (await pos()).o, { timeout: 3000 }).toBeGreaterThan(0.95);
  await expect.poll(() => near(p1), { timeout: 3000 }).toBeLessThan(4);
  // It follows, eased: a new point moves the glow there.
  const p2 = { x: hero.x + hero.width * 0.3, y: hero.y + hero.height * 0.6 };
  await page.mouse.move(p2.x, p2.y, { steps: 4 });
  await expect.poll(() => near(p2), { timeout: 3000 }).toBeLessThan(4);
  // Writes only transform/opacity on the overlay; the photo never moves with the pointer.
  for (const p of await light.evaluate((el) => [...(el as HTMLElement).style])) expect(p).toMatch(/^(transform|opacity)$/);
  for (const v of await restState(page, '[data-hero-media], [data-hero-media] img')) expect(v).toEqual(['1', 'none']);
  expect(await page.locator('.hero [data-parallax]').evaluate((el) => (el as HTMLElement).style.transform)).toBe('');

  // Leave the photo: the glow fades out, the loop stops and cleans up.
  await page.mouse.move(hero.x + 20, 10);
  await expect.poll(() => light.evaluate((el) => el.getAttribute('style') ?? ''), { timeout: 4000 }).toBe('');
  const writes = await page.evaluate(
    () =>
      new Promise<number>((r) => {
        let n = 0;
        const mo = new MutationObserver(() => n++);
        mo.observe(document.querySelector('.hero')!, { attributes: true, subtree: true, attributeFilter: ['style'] });
        setTimeout(() => (mo.disconnect(), r(n)), 400);
      }),
  );
  expect(writes).toBe(0);
});

test.describe('утренний свет на сенсорном экране', () => {
  test.use({ hasTouch: true, isMobile: true });
  test('телефон: света нет, касание фото ничего не двигает', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile');
    await page.goto('/ostov/');
    await heroSettled(page);
    expect(await page.locator('[data-hero-light]').evaluate((el) => getComputedStyle(el).display)).toBe('none');
    await page.touchscreen.tap(200, 300);
    await page.waitForTimeout(300);
    expect(await page.locator('[data-hero-light]').evaluate((el) => el.getAttribute('style'))).toBeNull();
  });
});

test('первый экран: анимируются только transform и opacity', async ({ page }) => {
  await page.goto('/ostov/');
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll('.hero, .hero *')) {
      for (const pseudo of [null, '::before', '::after']) {
        const cs = getComputedStyle(el, pseudo);
        const props = cs.transitionProperty.split(',').map((x) => x.trim());
        const durs = cs.transitionDuration.split(',').map((x) => parseFloat(x));
        props.forEach((prop, i) => {
          if (durs[i % durs.length]! > 0 && !/^(transform|opacity)$/.test(prop)) out.push(`${el.className}${pseudo ?? ''}: ${prop}`);
        });
      }
    }
    for (const a of document.getAnimations()) {
      const t = (a.effect as KeyframeEffect).target as Element;
      if (!t.closest('.hero')) continue;
      for (const k of (a.effect as KeyframeEffect).getKeyframes()) {
        for (const p of Object.keys(k)) if (!['offset', 'easing', 'composite', 'computedOffset', 'opacity', 'transform'].includes(p)) out.push(`${(a as CSSAnimation).animationName}: ${p}`);
      }
    }
    return out;
  });
  expect(bad).toEqual([]);
});
