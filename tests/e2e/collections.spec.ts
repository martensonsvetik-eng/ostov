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

// Раунд 2 (заказчик, 2026-11-24): наведение на карточки коллекций и материалов.
test.describe('наведение на карточки', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, 'эффект для устройств с наведением, проверяем на компьютере');
  // Раунд 3: вуаль заменена на круглую метку «Подробнее», которая следует за курсором.
  const shift = (el: Element) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return [Math.round(m.m41), Math.round(m.m42)];
  };
  const scaleOf = (el: Element) => new DOMMatrix(getComputedStyle(el).transform).a;

  test('коллекции: вуали нет, метка появляется и следует за курсором, фото приближается', async ({ page }) => {
    await page.goto('/ostov/');
    const card = page.locator('[data-collection]').first();
    const media = card.locator('[data-collection-media]');
    const cursor = media.locator('[data-collection-cursor]');
    const badge = media.locator('[data-collection-badge]');
    await card.scrollIntoViewIfNeeded();
    // Ждём конца появления при прокрутке (карточка поднимается на 20 px), чтобы мерить итоговое место.
    await expect.poll(() => card.evaluate((e) => getComputedStyle(e).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    // Старой вуали больше нет.
    expect(await media.evaluate((e) => getComputedStyle(e, '::after').content)).toBe('none');
    await expect(cursor).toHaveAttribute('aria-hidden', 'true');
    await expect(badge).toHaveText('Подробнее');
    expect(await badge.evaluate((e) => getComputedStyle(e).opacity)).toBe('0');

    const box = (await media.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx - 60, cy - 80);
    await expect.poll(() => badge.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    await expect.poll(() => cursor.evaluate(shift)).toEqual([-60, -80]);
    await expect.poll(() => media.locator('picture').evaluate(scaleOf)).toBeCloseTo(1.05, 2);
    // Курсор сдвинулся — метка догоняет его плавно и остаётся внутри фото.
    await page.mouse.move(cx + 50, cy + 40, { steps: 4 });
    await expect.poll(() => cursor.evaluate(shift)).toEqual([50, 40]);
    // У левого края (верх карточки может быть под закреплённой шапкой) метка упирается в отступ 8 px.
    await page.mouse.move(box.x + 2, cy, { steps: 2 });
    const ex = box.width / 2 - 48 - 8;
    await expect
      .poll(async () => {
        const [x, y] = await cursor.evaluate(shift);
        return Math.abs(x! + ex) <= 1 && Math.abs(y!) <= 1;
      })
      .toBe(true);
    const b = (await badge.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(box.x);
    expect(b.y).toBeGreaterThanOrEqual(box.y);
    expect(b.x).toBeCloseTo(box.x + 8, 0);
    // Текст метки: белый на чёрном с непрозрачностью 95%.
    expect(await badge.evaluate((e) => [getComputedStyle(e).color, getComputedStyle(e).backgroundColor])).toEqual([
      'rgb(255, 255, 255)',
      'rgba(0, 0, 0, 0.95)',
    ]);
    await page.mouse.move(0, 0);
    await expect.poll(() => badge.evaluate((e) => getComputedStyle(e).opacity)).toBe('0');
    await expect.poll(() => media.locator('picture').evaluate(scaleOf)).toBe(1);
  });

  test('коллекции: клик по фото раскрывает и сворачивает подробности, метка меняет текст', async ({ page }) => {
    await page.goto('/ostov/');
    const card = page.locator('[data-collection]').nth(1);
    const media = card.locator('[data-collection-media]');
    const btn = card.locator('[data-collection-toggle]');
    const panel = page.locator(`#${await btn.getAttribute('aria-controls')}`);
    await media.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    await expect(media.locator('[data-collection-badge]')).toHaveText('Свернуть');
    await media.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();
    await expect(media.locator('[data-collection-badge]')).toHaveText('Подробнее');
  });

  test('коллекции: фокус с клавиатуры даёт статичное приближение без метки, клик мышью — нет', async ({ page }) => {
    await page.goto('/ostov/');
    const card = page.locator('[data-collection]').first();
    const pic = card.locator('[data-collection-media] picture');
    const btn = card.locator('[data-collection-toggle]');
    await btn.click();
    await page.mouse.move(0, 0);
    await expect.poll(() => pic.evaluate(scaleOf)).toBe(1);
    await btn.click();
    // Pointer off the cards: Shift+Tab lands on the hero link and smooth-scrolls the page up and
    // back, which would sweep the photo under a resting pointer and show the badge by hover.
    await page.mouse.move(0, 0);
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(btn).toBeFocused();
    await expect.poll(() => pic.evaluate(scaleOf)).toBeCloseTo(1.05, 2);
    expect(await card.locator('[data-collection-badge]').evaluate((e) => getComputedStyle(e).opacity)).toBe('0');
  });

  test.describe('уменьшение движения', () => {
    test.use({ reducedMotion: 'reduce' });
    test('коллекции: метка не следует за курсором, переходов нет', async ({ page }) => {
      await page.goto('/ostov/');
      const media = page.locator('[data-collection-media]').first();
      await media.scrollIntoViewIfNeeded();
      const box = (await media.boundingBox())!;
      await page.mouse.move(box.x + 30, box.y + 40);
      await page.mouse.move(box.x + 60, box.y + 90, { steps: 3 });
      expect(await media.locator('[data-collection-cursor]').evaluate((e) => getComputedStyle(e).transform)).toBe('none');
      expect(
        await media.locator('[data-collection-badge]').evaluate((e) => getComputedStyle(e).transitionDuration),
      ).toBe('0s');
    });
  });

  test('материалы: рамка приближается, линия прорисовывается, у фото с параллаксом свой transform', async ({ page }) => {
    await page.goto('/ostov/');
    const scene = page.locator('[data-material]').first();
    await scene.scrollIntoViewIfNeeded();
    const zoom = scene.locator('.material__zoom');
    const line = (el: Element) => getComputedStyle(el, '::before').transform;
    expect(await zoom.evaluate((e) => getComputedStyle(e).transform)).toBe('none');
    // Раскладка без учёта transform (у карточки ещё может идти появление при прокрутке).
    const layout = () => scene.evaluate((e: HTMLElement) => [e.offsetLeft, e.offsetTop, e.offsetWidth, e.offsetHeight]);
    const box = await layout();
    await scene.hover();
    await expect.poll(() => zoom.evaluate((e) => getComputedStyle(e).transform)).toBe('matrix(1.04, 0, 0, 1.04, 0, 0)');
    await expect.poll(() => scene.locator('.material__caption').evaluate(line)).toBe('matrix(1, 0, 0, 1, 0, 0)');
    // Масштаб 1.12 у <img> остаётся (его двигает параллакс), сдвига раскладки и прокрутки нет.
    expect(await scene.locator('img').evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).a)).toBeCloseTo(1.12);
    expect(await layout()).toEqual(box);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});
