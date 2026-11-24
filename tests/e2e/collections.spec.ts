import { test, expect } from '@playwright/test';

const BLOCKS = '#collections img, #materials img';

test('коллекции: три карточки и копия блока', async ({ page }) => {
  await page.goto('/ostov/');
  const s = page.locator('#collections');
  await expect(s.locator('h2')).toHaveText('Три характера одной мастерской');
  const cards = s.locator('[data-collection]');
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toContainText('Тихая геометрия');
  await expect(cards.nth(0)).toContainText('Строгие плоскости, скрытые ручки, морёный и светлый дуб.');
  await expect(cards.nth(1)).toContainText('Тёплый модерн');
  await expect(cards.nth(2)).toContainText('Неоклассика');
});

test('«Подробнее» раскрывает на месте 2–3 фото и описание, повторный клик сворачивает', async ({ page }) => {
  await page.goto('/ostov/');
  const buttons = page.locator('#collections [data-collection-toggle]');
  await expect(buttons).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const btn = buttons.nth(i);
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    const id = await btn.getAttribute('aria-controls');
    expect(id).toBeTruthy();
    const panel = page.locator(`#${id}`);
    await expect(panel).toBeHidden();

    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    const imgs = panel.locator('img');
    const n = await imgs.count();
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(3);
    await expect(panel.locator('[data-collection-description]')).toBeVisible();
    await expect(panel.locator('[data-collection-description]')).not.toBeEmpty();
    // Раскрытие на месте: без перехода на другую страницу.
    expect(new URL(page.url()).pathname).toBe('/ostov/');

    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();
  }
});

test('ссылка «Запросить каталог коллекций (PDF)» под карточками', async ({ page }) => {
  await page.goto('/ostov/');
  const link = page.locator('#collections [data-open-modal="catalog"]');
  await expect(link).toHaveCount(1);
  await expect(link).toHaveText('Запросить каталог коллекций (PDF)');
  await expect(link).toHaveAttribute('data-variant', 'link');
});

test('материалы: тёмный фон, лид, четыре сцены, «Заказать образцы»', async ({ page }) => {
  await page.goto('/ostov/');
  const s = page.locator('#materials');
  await expect(s).toHaveClass(/on-dark/);
  expect(await s.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(36, 34, 31)');
  await expect(s.locator('h2')).toHaveText('Дерево и камень из одной мастерской');
  await expect(s).toContainText('Мы сами пилим камень и строгаем дерево');
  const scenes = s.locator('[data-material]');
  await expect(scenes).toHaveCount(4);
  for (const [i, name] of ['Дуб', 'Травертин', 'Латунь', 'Фурнитура'].entries()) {
    await expect(scenes.nth(i)).toContainText(name);
  }
  const samples = s.locator('[data-open-modal="samples"]');
  await expect(samples).toHaveCount(1);
  await expect(samples).toHaveText('Заказать образцы');
  // Материалы идут сразу после коллекций.
  expect(
    await page.evaluate(() => document.querySelector('#collections ~ section')?.id),
  ).toBe('materials');
});

test('все изображения блоков имеют alt, кроме декоративных', async ({ page }) => {
  await page.goto('/ostov/');
  const imgs = page.locator(BLOCKS);
  expect(await imgs.count()).toBeGreaterThanOrEqual(3 + 3 * 2 + 4);
  const missing = await imgs.evaluateAll((els) =>
    els
      .filter((el) => el.getAttribute('aria-hidden') !== 'true' && el.getAttribute('role') !== 'presentation')
      .filter((el) => !(el.getAttribute('alt') ?? '').trim())
      .map((el) => el.getAttribute('src')),
  );
  expect(missing).toEqual([]);
});

test('изображения ниже первого экрана грузятся лениво и имеют пропорции', async ({ page }) => {
  await page.goto('/ostov/');
  const imgs = page.locator(BLOCKS);
  const bad = await imgs.evaluateAll((els) =>
    els
      .filter((el) => el.getAttribute('loading') !== 'lazy' || !el.getAttribute('width') || !el.getAttribute('height'))
      .map((el) => el.getAttribute('src')),
  );
  expect(bad).toEqual([]);
});

test('изображения блоков: AVIF и WebP с srcset', async ({ page }) => {
  await page.goto('/ostov/');
  const types = await page
    .locator('#collections picture source, #materials picture source')
    .evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('type')))]);
  expect(types).toEqual(expect.arrayContaining(['image/avif', 'image/webp']));
});

test('английская версия: коллекции и материалы', async ({ page }) => {
  await page.goto('/ostov/en/');
  await expect(page.locator('#collections h2')).toHaveText('Three characters from one workshop');
  await expect(page.locator('#collections [data-collection-toggle]').first()).toContainText('Details');
  await expect(page.locator('#collections [data-open-modal="catalog"]')).toHaveText(
    'Request the collections catalogue (PDF)',
  );
  await expect(page.locator('#materials h2')).toHaveText('Wood and stone from one workshop');
  await expect(page.locator('#materials [data-open-modal="samples"]')).toHaveText('Order samples');
});

test('анимируются только transform и opacity', async ({ page }) => {
  await page.goto('/ostov/');
  await page.locator('#collections [data-collection-toggle]').first().click();
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll('#collections, #collections *, #materials, #materials *')) {
      for (const pseudo of [null, '::before', '::after']) {
        const cs = getComputedStyle(el, pseudo);
        const props = cs.transitionProperty.split(',').map((x) => x.trim());
        const durs = cs.transitionDuration.split(',').map((x) => parseFloat(x));
        props.forEach((prop, i) => {
          if (durs[i % durs.length]! > 0 && !/^(transform|opacity)$/.test(prop)) out.push(`${el.className}${pseudo ?? ''}: ${prop}`);
        });
      }
    }
    // Keyframe animations: only transform/opacity are allowed in their keyframes.
    for (const sheet of document.styleSheets) {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSKeyframesRule && /collection|material/i.test(rule.name)) {
          for (const kf of rule.cssRules) {
            const style = (kf as CSSKeyframeRule).style;
            for (let i = 0; i < style.length; i++) {
              if (!/^(transform|opacity|translate)$/.test(style[i]!)) out.push(`@keyframes ${rule.name}: ${style[i]}`);
            }
          }
        }
      }
    }
    return out;
  });
  expect(bad).toEqual([]);
});

test.describe('коллекции: уменьшение движения', () => {
  test.use({ reducedMotion: 'reduce' });
  test('раскрытие без анимации', async ({ page }) => {
    await page.goto('/ostov/');
    await page.locator('#collections [data-collection-toggle]').first().click();
    const moving = await page.evaluate(() =>
      [...document.querySelectorAll('#collections, #collections *, #materials, #materials *')].filter((el) => {
        const s = getComputedStyle(el);
        const d = s.transitionDuration.split(',').some((v) => parseFloat(v) > 0);
        return d || (s.animationName !== 'none' && parseFloat(s.animationDuration) > 0);
      }).length,
    );
    expect(moving).toBe(0);
  });
});

test('360px: без горизонтальной прокрутки с раскрытой коллекцией', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/ostov/');
  await page.locator('#collections [data-collection-toggle]').first().click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= 360)).toBe(true);
});
